import { prisma } from "@/lib/db";
import { analyzeConversation } from "@/server/ai/analyze";
import { maybeAutoReply } from "@/server/ai/auto-reply";
import type { InboundMessage } from "@/server/whatsapp";
import type { AnalysisMessage } from "@/server/ai/schema";

/**
 * Ingest one inbound WhatsApp message: upsert its conversation, store the
 * message, flag a reply is owed, and re-run the AI analysis to keep the
 * conversation's classification / urgency / summary current.
 */
export async function ingestInbound(agentId: string, msg: InboundMessage) {
  // WhatsApp retries webhooks — ignore messages we've already stored.
  if (msg.externalId) {
    const existing = await prisma.message.findFirst({
      where: { agentId, externalId: msg.externalId },
      select: { id: true },
    });
    if (existing) return existing.id;
  }

  const client = await prisma.contact.findFirst({
    where: { agentId, phone: msg.from },
    select: { id: true },
  });

  const conversation = await prisma.conversation.upsert({
    where: { agentId_contactPhone: { agentId, contactPhone: msg.from } },
    create: {
      agentId,
      contactPhone: msg.from,
      contactName: msg.name ?? msg.from,
      clientId: client?.id,
      awaitingReply: true,
      lastMessageAt: new Date(),
    },
    update: {
      awaitingReply: true,
      lastMessageAt: new Date(),
      ...(msg.name ? { contactName: msg.name } : {}),
      ...(client?.id ? { clientId: client.id } : {}),
    },
  });

  await prisma.message.create({
    data: {
      agentId,
      conversationId: conversation.id,
      direction: "inbound",
      type: msg.type,
      body: msg.text,
      mediaUrl: msg.mediaId, // resolved to a real URL + transcription in Chunk 13
      reviewed: msg.type !== "voice",
      externalId: msg.externalId,
    },
  });

  // Re-analyse the whole thread.
  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
  });
  const transcript: AnalysisMessage[] = messages
    .map((m) => ({ direction: m.direction, text: m.transcription ?? m.body ?? "" }))
    .filter((m) => m.text.trim().length > 0);

  if (transcript.length > 0) {
    const analysis = await analyzeConversation(transcript);
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        classification: analysis.classification,
        urgency: analysis.urgency,
        summary: analysis.summary,
        // Store the contact-tag suggestion; the agent confirms or dismisses it
        // in the inbox. Never auto-applies to the Contact.
        categorySuggested: analysis.contactCategory,
      },
    });
  }

  // Auto-reply / quiet-hours handling (respects agent settings).
  await maybeAutoReply(agentId, conversation.id);

  return conversation.id;
}
