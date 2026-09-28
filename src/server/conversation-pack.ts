"use server";

import { resolveMergeFields } from "@/server/pdf/merge";
import { formatAED } from "@/lib/utils";
import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import { sendBulkPdf, type BulkSendResult } from "@/server/bulk-send";

/**
 * Generate a branded PDF pack from a template + property and send it to the
 * contact in a single conversation. Ensures the conversation has a linked
 * Contact (creating one from the WhatsApp details if needed), then reuses the
 * bulk-send pipeline for the one recipient.
 */
export async function sendPackToConversation(input: {
  conversationId: string;
  templateId: string;
  propertyId: string;
  caption?: string;
}): Promise<BulkSendResult> {
  const agent = await getCurrentAgent();
  const conv = await prisma.conversation.findFirst({
    where: { id: input.conversationId, agentId: agent.id },
    select: { id: true, clientId: true, contactPhone: true, contactName: true },
  });
  if (!conv) {
    return {
      generated: false,
      sent: 0,
      failed: 0,
      recipients: [],
      demo: true,
      error: "Conversation not found.",
    };
  }

  let contactId = conv.clientId;
  if (!contactId) {
    const contact = await prisma.contact.upsert({
      where: {
        agentId_phone: { agentId: agent.id, phone: conv.contactPhone },
      },
      create: {
        agentId: agent.id,
        name: conv.contactName ?? conv.contactPhone,
        phone: conv.contactPhone,
      },
      update: {},
    });
    contactId = contact.id;
    await prisma.conversation.update({
      where: { id: conv.id },
      data: { clientId: contactId },
    });
  }

  return sendBulkPdf({
    templateId: input.templateId,
    propertyId: input.propertyId,
    contactIds: [contactId],
    caption: input.caption,
  });
}

/** Readable pack contents for browsers that cannot embed a PDF viewer. */
export async function previewConversationPack(templateId: string, propertyId: string) {
  const agent = await getCurrentAgent();
  const [template, property] = await Promise.all([
    prisma.template.findFirst({ where: { id: templateId, agentId: agent.id } }),
    prisma.property.findFirst({ where: { id: propertyId, agentId: agent.id } }),
  ]);
  if (!template || !property) return { error: "Choose an available template and property." };
  return { title: property.title, price: formatAED(property.price), area: property.area,
    specs: [property.bedrooms != null ? `${property.bedrooms} beds` : null, property.bathrooms != null ? `${property.bathrooms} baths` : null, property.sizeSqft != null ? `${property.sizeSqft.toLocaleString()} sqft` : null, property.propertyType].filter(Boolean).join(" · "),
    body: resolveMergeFields(template.body, property, agent), agentName: agent.name };
}
