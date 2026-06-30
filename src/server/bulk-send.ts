"use server";

import { revalidatePath } from "next/cache";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import { getStorage } from "@/server/storage";
import { sendDocument, isWhatsAppConfigured } from "@/server/whatsapp";
import { BrochureDocument } from "@/server/pdf/brochure";

const WINDOW_MS = 24 * 60 * 60 * 1000;
const THROTTLE_MS = 150; // gentle pacing; real tiers need a proper queue

export type BulkSendResult = {
  generated: boolean;
  sent: number;
  failed: number;
  recipients: {
    name: string;
    status: "sent" | "failed";
    needsTemplate: boolean;
    reason?: string;
  }[];
  demo: boolean;
  error?: string;
};

/**
 * Generate a PDF from a template + property and send it to multiple contacts
 * over WhatsApp. Records an outbound message per recipient and flags those
 * outside the 24-hour window (which require an approved template in production).
 * Sequential + throttled — a real queue/worker is the production path.
 */
export async function sendBulkPdf(input: {
  templateId: string;
  propertyId: string;
  contactIds: string[];
  caption?: string;
}): Promise<BulkSendResult> {
  const agent = await getCurrentAgent();
  const empty: BulkSendResult = {
    generated: false,
    sent: 0,
    failed: 0,
    recipients: [],
    demo: !isWhatsAppConfigured(),
  };

  if (!input.contactIds?.length) {
    return { ...empty, error: "Select at least one recipient." };
  }

  const [template, property] = await Promise.all([
    prisma.template.findFirst({
      where: { id: input.templateId, agentId: agent.id },
    }),
    prisma.property.findFirst({
      where: { id: input.propertyId, agentId: agent.id },
    }),
  ]);
  if (!template) return { ...empty, error: "Template not found." };
  if (!property) return { ...empty, error: "Choose a property for the PDF." };

  // 1. Generate the PDF once and store it.
  const buffer = await renderToBuffer(
    BrochureDocument({
      templateName: template.name,
      body: template.body,
      property,
      agent: { name: agent.name, phone: agent.phone, email: agent.email },
    }),
  );
  const asset = await prisma.mediaAsset.create({
    data: {
      agentId: agent.id,
      type: "brochure",
      name: `${template.name} — ${property.title}`,
      fileUrl: "",
      propertyId: property.id,
    },
  });
  await getStorage().put(asset.id, buffer, "application/pdf");
  const fileUrl = `/api/media/${asset.id}`;
  await prisma.mediaAsset.update({ where: { id: asset.id }, data: { fileUrl } });
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const link = base ? `${base}${fileUrl}` : fileUrl;
  const filename = `${template.name.replace(/[^\w-]+/g, "-")}.pdf`;
  const caption = input.caption?.trim() || `${property.title} — ${template.name}`;

  const contacts = await prisma.contact.findMany({
    where: { id: { in: input.contactIds }, agentId: agent.id },
    select: { id: true, name: true, phone: true },
  });

  const recipients: BulkSendResult["recipients"] = [];
  let sent = 0;
  let failed = 0;

  for (const contact of contacts) {
    // Ensure a conversation, and check the 24h customer-service window.
    const conversation = await prisma.conversation.upsert({
      where: {
        agentId_contactPhone: { agentId: agent.id, contactPhone: contact.phone },
      },
      create: {
        agentId: agent.id,
        contactPhone: contact.phone,
        contactName: contact.name,
        clientId: contact.id,
      },
      update: { clientId: contact.id },
      select: { id: true },
    });
    const lastInbound = await prisma.message.findFirst({
      where: { conversationId: conversation.id, direction: "inbound" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    const needsTemplate =
      !lastInbound || Date.now() - lastInbound.createdAt.getTime() > WINDOW_MS;

    try {
      const res = await sendDocument(contact.phone, link, filename, caption);
      await prisma.message.create({
        data: {
          agentId: agent.id,
          conversationId: conversation.id,
          direction: "outbound",
          type: "pdf",
          status: "sent",
          body: caption,
          mediaUrl: fileUrl,
          externalId: res.externalId,
        },
      });
      sent++;
      recipients.push({
        name: contact.name,
        status: "sent",
        needsTemplate,
        reason: needsTemplate
          ? "Outside 24h window — needs an approved template in production"
          : undefined,
      });
    } catch (e) {
      failed++;
      recipients.push({
        name: contact.name,
        status: "failed",
        needsTemplate,
        reason: e instanceof Error ? e.message : "Send failed",
      });
    }

    await new Promise((r) => setTimeout(r, THROTTLE_MS));
  }

  revalidatePath("/inbox");
  return {
    generated: true,
    sent,
    failed,
    recipients,
    demo: !isWhatsAppConfigured(),
  };
}
