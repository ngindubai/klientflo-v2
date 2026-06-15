import { prisma } from "@/lib/db";
import { analyzeConversation } from "@/server/ai/analyze";
import type { InboundMessage } from "@/server/whatsapp";
import type { AnalysisMessage } from "@/server/ai/schema";

/**
 * Ingest one inbound WhatsApp message: upsert its conversation, store the
 * message, flag a reply is owed, and re-run the AI analysis to keep the
 * conversation's classification / urgency / summary current.
 */
export async function ingestInbound(agentId: string, msg: InboundMessage) {
  const client = await prisma.client.findFirst({
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
      },
    });
  }

  return conversation.id;
}
