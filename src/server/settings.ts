import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";

/** Get (or lazily create) the settings row for a specific agent. */
export async function getSettingsByAgent(agentId: string) {
  const existing = await prisma.settings.findUnique({ where: { agentId } });
  if (existing) return existing;
  return prisma.settings.create({ data: { agentId } });
}

/** Settings for the current agent. */
export async function getSettings() {
  const agent = await getCurrentAgent();
  return getSettingsByAgent(agent.id);
}
