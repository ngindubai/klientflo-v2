"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import { sendText } from "@/server/whatsapp";
import { getAnthropic, isAIEnabled, AI_MODEL } from "@/server/ai/client";

/** Send an outbound WhatsApp reply in a conversation. */
export async function sendReply(conversationId: string, body: string) {
  const agent = await getCurrentAgent();
  const text = body.trim();
  if (!text) throw new Error("Message is empty.");

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, agentId: agent.id },
  });
  if (!conversation) throw new Error("Conversation not found.");

  let externalId: string | null = null;
  let status: "sent" | "failed" = "sent";
  try {
    const result = await sendText(conversation.contactPhone, text);
    externalId = result.externalId;
  } catch (err) {
    console.error("[whatsapp] send failed:", err);
    status = "failed";
  }

  await prisma.message.create({
    data: {
      agentId: agent.id,
      conversationId,
      direction: "outbound",
      type: "text",
      body: text,
      status,
      externalId,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { awaitingReply: false, lastMessageAt: new Date() },
  });

  revalidatePath("/inbox");
  revalidatePath("/dashboard");
}

/** Mark a voice note as reviewed. */
export async function markVoiceReviewed(messageId: string) {
  const agent = await getCurrentAgent();
  await prisma.message.updateMany({
    where: { id: messageId, agentId: agent.id },
    data: { reviewed: true },
  });
  revalidatePath("/inbox");
  revalidatePath("/dashboard");
}

/** Draft a reply for a conversation with Claude (or a template without a key). */
export async function suggestReply(conversationId: string): Promise<string> {
  const agent = await getCurrentAgent();
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, agentId: agent.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) throw new Error("Conversation not found.");

  const transcript = conversation.messages
    .map((m) => `${m.direction === "inbound" ? "Contact" : "Agent"}: ${m.transcription ?? m.body ?? ""}`)
    .filter((l) => l.trim().length > "Contact: ".length)
    .join("\n");

  const client = getAnthropic();
  if (!client || !isAIEnabled()) {
    return "Hi! Thanks for your message — I'll look into this and get back to you shortly. Best regards.";
  }

  try {
    const res = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 512,
      system: `You are ${agent.name}, a UAE real estate agent. Draft a warm, professional, concise WhatsApp reply to the contact based on the conversation. Return only the message text — no preamble, no quotes.`,
      output_config: { effort: "low" },
      messages: [{ role: "user", content: `Conversation:\n${transcript}\n\nDraft my reply:` }],
    });
    const text = res.content.find((b) => b.type === "text");
    return text && text.type === "text" ? text.text.trim() : "";
  } catch (err) {
    console.error("[ai] suggestReply failed:", err);
    return "Hi! Thanks for your message — I'll get back to you shortly.";
  }
}
