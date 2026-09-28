"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import { downloadMedia, isWhatsAppConfigured } from "@/server/whatsapp";
import { transcribeAudio, isSpeechConfigured } from "@/server/speech";
import { analyzeConversation } from "@/server/ai/analyze";
import { getAnthropic, isAIEnabled, AI_MODEL } from "@/server/ai/client";
import type { AnalysisMessage } from "@/server/ai/schema";

/**
 * Voice-note pipeline: download the media, transcribe it, store the
 * transcription, then re-run the conversation analysis (summary / urgency /
 * next action). Returns the transcription, or a note when STT isn't configured.
 */
export async function transcribeVoiceNote(messageId: string) {
  const agent = await getCurrentAgent();
  const message = await prisma.message.findFirst({
    where: { id: messageId, agentId: agent.id, type: "voice" },
  });
  if (!message) throw new Error("Voice note not found.");

  let transcription = "";
  if (message.mediaUrl && isWhatsAppConfigured() && isSpeechConfigured()) {
    const media = await downloadMedia(message.mediaUrl);
    if (media) transcription = await transcribeAudio(media.data, media.mime);
  }
  if (!transcription) {
    return { error: !isWhatsAppConfigured() || !isSpeechConfigured() ? "Voice-note transcription is available after the approved WhatsApp and speech connections are enabled. No transcript has been generated." : "Could not transcribe this voice note. Please try again." };
  }

  await prisma.message.update({
    where: { id: message.id },
    data: { transcription },
  });

  // Re-analyse the conversation now that the voice note has text.
  const messages = await prisma.message.findMany({
    where: { conversationId: message.conversationId },
    orderBy: { createdAt: "asc" },
  });
  const transcript: AnalysisMessage[] = messages
    .map((m) => ({ direction: m.direction, text: m.transcription ?? m.body ?? "" }))
    .filter((m) => m.text.trim().length > 0 && !m.text.startsWith("[Voice note"));

  if (transcript.length > 0) {
    const analysis = await analyzeConversation(transcript);
    await prisma.conversation.update({
      where: { id: message.conversationId },
      data: {
        classification: analysis.classification,
        urgency: analysis.urgency,
        summary: analysis.summary,
      },
    });
  }

  revalidatePath("/inbox");
  revalidatePath("/dashboard");
  return { transcription };
}

/** Polish dictated text into a professional WhatsApp message (dictation flow). */
export async function polishMessage(text: string): Promise<string> {
  const raw = text.trim();
  if (!raw) return "";

  const client = getAnthropic();
  if (!client || !isAIEnabled()) {
    // Lightweight cleanup without a key: capitalise and ensure end punctuation.
    const t = raw.charAt(0).toUpperCase() + raw.slice(1);
    return /[.!?]$/.test(t) ? t : t + ".";
  }

  try {
    const res = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 512,
      system:
        "You clean up a real estate agent's dictated WhatsApp message: fix grammar and punctuation and make it professional, warm and concise. Preserve the meaning and any specifics (names, prices, dates). Return only the cleaned message — no preamble, no quotes.",
      output_config: { effort: "low" },
      messages: [{ role: "user", content: raw }],
    });
    const block = res.content.find((b) => b.type === "text");
    return block && block.type === "text" ? block.text.trim() : raw;
  } catch (err) {
    console.error("[ai] polishMessage failed:", err);
    return raw;
  }
}
