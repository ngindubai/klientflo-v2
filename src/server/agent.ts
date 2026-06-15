import { cache } from "react";
import { prisma } from "@/lib/db";
import { getSessionAgentId } from "@/server/auth";

/**
 * Returns the current agent. Resolves the signed-in agent from the session
 * cookie when present; otherwise falls back to the first agent (single-agent
 * Phase 1, and system contexts like the WhatsApp webhook or scripts that have
 * no request cookies).
 */
export const getCurrentAgent = cache(async () => {
  const sessionId = await getSessionAgentId();
  if (sessionId) {
    const agent = await prisma.agent.findUnique({ where: { id: sessionId } });
    if (agent) return agent;
  }

  const agent = await prisma.agent.findFirst({ orderBy: { createdAt: "asc" } });
  if (!agent) {
    throw new Error(
      "No agent found. Run `pnpm db:seed` to create the initial agent.",
    );
  }
  return agent;
});
