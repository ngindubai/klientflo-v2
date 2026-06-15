import { prisma } from "@/lib/db";
import { analyzeConversation } from "@/server/ai/analyze";
import type { AnalysisMessage, Requirements } from "@/server/ai/schema";

const EMPTY: Requirements = {
  clientType: null,
  area: null,
  budgetMin: null,
  budgetMax: null,
  bedrooms: null,
  propertyType: null,
  paymentMethod: null,
  timeline: null,
};

/**
 * Analyse all of a client's conversations, persist each conversation's
 * classification/urgency/summary, and fill any *empty* client requirement
 * fields from the merged extraction (existing values are never overwritten).
 * Returns the updated client. Scoped to the given agent.
 */
export async function populateClientFromConversations(
  clientId: string,
  agentId: string,
) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, agentId },
    include: {
      conversations: {
        include: { messages: { orderBy: { createdAt: "asc" } } },
      },
    },
  });
  if (!client) throw new Error("Client not found.");

  const merged: Requirements = { ...EMPTY };
  let suggestedNextAction: string | null = null;

  for (const conversation of client.conversations) {
    const messages: AnalysisMessage[] = conversation.messages
      .map((m) => ({
        direction: m.direction,
        text: m.transcription ?? m.body ?? "",
      }))
      .filter((m) => m.text.trim().length > 0);
    if (messages.length === 0) continue;

    const analysis = await analyzeConversation(messages);

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        classification: analysis.classification,
        urgency: analysis.urgency,
        summary: analysis.summary,
      },
    });

    for (const key of Object.keys(merged) as (keyof Requirements)[]) {
      if (merged[key] == null && analysis.requirements[key] != null) {
        // @ts-expect-error key-aligned assignment across the union
        merged[key] = analysis.requirements[key];
      }
    }
    suggestedNextAction ??= analysis.suggestedNextAction;
  }

  return prisma.client.update({
    where: { id: clientId },
    data: {
      clientType: client.clientType ?? merged.clientType,
      area: client.area ?? merged.area,
      budgetMin: client.budgetMin ?? merged.budgetMin,
      budgetMax: client.budgetMax ?? merged.budgetMax,
      bedrooms: client.bedrooms ?? merged.bedrooms,
      propertyType: client.propertyType ?? merged.propertyType,
      paymentMethod: client.paymentMethod ?? merged.paymentMethod,
      timeline: client.timeline ?? merged.timeline,
      nextAction: client.nextAction ?? suggestedNextAction,
    },
  });
}
