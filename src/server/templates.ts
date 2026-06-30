import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";

export async function getTemplates() {
  const agent = await getCurrentAgent();
  return prisma.template.findMany({
    where: { agentId: agent.id },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getTemplate(id: string) {
  const agent = await getCurrentAgent();
  return prisma.template.findFirst({ where: { id, agentId: agent.id } });
}
