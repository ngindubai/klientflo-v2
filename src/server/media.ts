import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";

export type MediaType = "floorplan" | "video";

export async function getMedia(type: MediaType) {
  const agent = await getCurrentAgent();
  return prisma.mediaAsset.findMany({
    where: { agentId: agent.id, type },
    orderBy: { createdAt: "desc" },
    include: { property: { select: { id: true, title: true } } },
  });
}
