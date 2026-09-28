import type { Prisma } from "@/generated/prisma/client";
import { HIGH_PRIORITY_INTENTS, GENERAL_PRIORITY_INTENTS, type PriorityLevel } from "@/lib/conversation-priority";
import { CONVERSATION_CLASSIFICATIONS, CONTACT_CATEGORIES } from "@/lib/constants";
export type InboxFilters = { minUrgency?: number; priority?: PriorityLevel; category?: string; tag?: string; query?: string; status?: string; sort?: string };
export function priorityWhere(level: PriorityLevel): Prisma.ConversationWhereInput {
  const low: Prisma.ConversationWhereInput = { OR: [{ client: { is: { category: { in: ["personal", "spam"] } } } }, { classification: { in: ["spam", "low_priority"] } }] };
  if (level === "low") return low;
  // Nullable fields need explicit inclusion, otherwise untagged enquiries vanish.
  const business: Prisma.ConversationWhereInput[] = [
    { OR: [{ clientId: null }, { client: { is: { category: { notIn: ["personal", "spam"] } } } }] },
    { OR: [{ classification: null }, { classification: { notIn: ["spam", "low_priority"] } }] },
  ];
  const urgent: Prisma.ConversationWhereInput = { AND: [{ urgency: { gte: 4 } }, { OR: [{ classification: null }, { classification: { notIn: [...GENERAL_PRIORITY_INTENTS] } }] }] };
  const ordinary: Prisma.ConversationWhereInput = { OR: [{ urgency: { lt: 4 } }, { classification: { in: [...GENERAL_PRIORITY_INTENTS] } }] };
  return { AND: [...business, level === "high" ? { OR: [{ classification: { in: [...HIGH_PRIORITY_INTENTS] } }, urgent] } : { AND: [ordinary, { OR: [{ classification: null }, { classification: { notIn: [...HIGH_PRIORITY_INTENTS] } }] }] }] };
}
export function conversationWhere(agentId: string, filters: InboxFilters): Prisma.ConversationWhereInput {
  const clauses: Prisma.ConversationWhereInput[] = [{ agentId }];
  if (filters.priority) clauses.push(priorityWhere(filters.priority));
  if (filters.minUrgency && Number.isFinite(filters.minUrgency) && filters.minUrgency >= 1 && filters.minUrgency <= 5) clauses.push({ urgency: { gte: filters.minUrgency } });
  if (filters.category && CONVERSATION_CLASSIFICATIONS.includes(filters.category as never)) clauses.push({ classification: filters.category as never });
  if (filters.tag && CONTACT_CATEGORIES.includes(filters.tag as never)) clauses.push({ client: { is: { category: filters.tag as never } } });
  if (filters.status === "pending") clauses.push({ awaitingReply: true });
  if (filters.status === "handled") clauses.push({ awaitingReply: false });
  if (filters.status === "voice") clauses.push({ messages: { some: { type: "voice", direction: "inbound", reviewed: false } } });
  if (filters.status === "drafts") clauses.push({ messages: { some: { status: "pending", aiGenerated: true } } });
  const q = filters.query?.trim().slice(0, 200);
  if (q) {
    const match = { contains: q, mode: "insensitive" as const };
    clauses.push({ OR: [{ contactName: match }, { contactPhone: match }, { client: { is: { name: match } } }, { messages: { some: { OR: [{ body: match }, { transcription: match }] } } }] });
  }
  return { AND: clauses };
}
