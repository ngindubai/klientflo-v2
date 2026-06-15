import { cache } from "react";
import { prisma } from "@/lib/db";

/**
 * Returns the current agent. Phase 1 is single-agent, so we resolve the first
 * agent in the database. Real authentication arrives in Chunk 15, at which
 * point this becomes session-aware.
 */
export const getCurrentAgent = cache(async () => {
  const agent = await prisma.agent.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!agent) {
    throw new Error(
      "No agent found. Run `pnpm db:seed` to create the initial agent.",
    );
  }
  return agent;
});
