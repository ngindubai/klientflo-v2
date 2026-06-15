import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";

export async function getConversations() {
  const agent = await getCurrentAgent();
  return prisma.conversation.findMany({
    where: { agentId: agent.id },
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    include: {
      client: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
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
