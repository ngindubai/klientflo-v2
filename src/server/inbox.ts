import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { getCurrentAgent } from "@/server/agent";
import { conversationWhere, priorityWhere, type InboxFilters } from "@/server/inbox-query";
import type { PriorityLevel } from "@/lib/conversation-priority";
export type { InboxFilters } from "@/server/inbox-query";
export const CONVERSATIONS_PAGE_SIZE = 25;

export async function getConversations(filters: InboxFilters = {}, page = 1) {
  const agent = await getCurrentAgent();
  const where = conversationWhere(agent.id, filters);
  const include = { client: { select: { id: true, name: true, category: true } }, messages: { orderBy: { createdAt: "desc" as const }, take: 1 } };
  const orderBy: Prisma.ConversationOrderByWithRelationInput[] = [{ lastMessageAt: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }, { id: "asc" }];
  let skip = (Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1) - 1) * CONVERSATIONS_PAGE_SIZE;
  if (filters.sort === "newest") return prisma.conversation.findMany({ where, include, orderBy, skip, take: CONVERSATIONS_PAGE_SIZE });
  const levels: PriorityLevel[] = filters.priority ? [filters.priority] : ["high", "medium", "low"];
  const counts = await Promise.all(levels.map(level => prisma.conversation.count({ where: { AND: [where, priorityWhere(level)] } })));
  const rows: Prisma.ConversationGetPayload<{ include: typeof include }>[] = [];
  for (let i = 0; i < levels.length && rows.length < CONVERSATIONS_PAGE_SIZE; i++) {
    if (skip >= counts[i]) { skip -= counts[i]; continue; }
    rows.push(...await prisma.conversation.findMany({ where: { AND: [where, priorityWhere(levels[i])] }, include, orderBy, skip, take: CONVERSATIONS_PAGE_SIZE - rows.length }));
    skip = 0;
  }
  return rows;
}

export async function getConversationsCount(filters: InboxFilters = {}) {
  const agent = await getCurrentAgent();
  return prisma.conversation.count({
    where: conversationWhere(agent.id, filters),
  });
}

export async function getConversation(id: string) {
  const agent = await getCurrentAgent();
  return prisma.conversation.findFirst({
    where: { id, agentId: agent.id },
    include: {
      client: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}
