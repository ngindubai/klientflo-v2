import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";

/** Login accounts for the current agent tenant. */
export async function getTeamUsers() {
  const agent = await getCurrentAgent();
  return prisma.user.findMany({
    where: { agentId: agent.id },
    select: { id: true, email: true, name: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}
