"use server";

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
