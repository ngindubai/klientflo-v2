import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";

export type InboxFilters = {
  minUrgency?: number;
  category?: string;
  tag?: string;
};

export const CONVERSATIONS_PAGE_SIZE = 25;

function conversationWhere(agentId: string, filters: InboxFilters) {
  return {
    agentId,
    ...(filters.minUrgency ? { urgency: { gte: filters.minUrgency } } : {}),
    ...(filters.category ? { classification: filters.category as never } : {}),
    // Tag (contact category) axis. Spam is hidden from the default inbox
    // unless the user explicitly filters to it.
    ...(filters.tag
      ? { client: { category: filters.tag as never } }
      : { NOT: { client: { category: "spam" as never } } }),
  };
}

export async function getConversations(filters: InboxFilters = {}, page = 1) {
  const agent = await getCurrentAgent();
  return prisma.conversation.findMany({
    where: conversationWhere(agent.id, filters),
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    include: {
      client: { select: { id: true, name: true, category: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    skip: (Math.max(1, page) - 1) * CONVERSATIONS_PAGE_SIZE,
    take: CONVERSATIONS_PAGE_SIZE,
  });
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
