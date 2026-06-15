"use server";

import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import { analyzeConversation } from "@/server/ai/analyze";
import type { AnalysisMessage } from "@/server/ai/schema";

/**
 * Analyse a conversation with the AI layer and persist the classification,
 * urgency and summary back onto the Conversation. Returns the analysis (which
 * includes extracted requirements + a suggested next action) for the caller to
 * act on. Auto-populating the Client record from requirements lands in Chunk 7.
 */
export async function analyzeAndPersistConversation(conversationId: string) {
  const agent = await getCurrentAgent();

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, agentId: agent.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const messages: AnalysisMessage[] = conversation.messages
    .map((m) => ({
      direction: m.direction,
      text: m.transcription ?? m.body ?? "",
    }))
    .filter((m) => m.text.trim().length > 0);

  const analysis = await analyzeConversation(messages);

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      classification: analysis.classification,
      urgency: analysis.urgency,
      summary: analysis.summary,
    },
  });

  return analysis;
}
