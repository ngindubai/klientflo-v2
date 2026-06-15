import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import {
  SALES_PIPELINE_STAGES,
  RENTAL_PIPELINE_STAGES,
  humanizeEnum,
  type DealType,
} from "@/lib/constants";

export function stagesFor(type: DealType): readonly string[] {
  return type === "sale" ? SALES_PIPELINE_STAGES : RENTAL_PIPELINE_STAGES;
}

/** Deals for a pipeline, grouped into ordered stage columns. */
export async function getPipeline(type: DealType) {
  const agent = await getCurrentAgent();
  const deals = await prisma.deal.findMany({
    where: { agentId: agent.id, type },
    include: { client: true, property: true },
    orderBy: { updatedAt: "desc" },
  });

  const columns = stagesFor(type).map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage);
    return {
      stage,
      label: humanizeEnum(stage),
      deals: stageDeals,
      total: stageDeals.reduce((sum, d) => sum + (d.amount ?? 0), 0),
    };
  });

  return { columns, count: deals.length };
}

export async function getDealFormOptions() {
  const agent = await getCurrentAgent();
  const [clients, properties] = await Promise.all([
    prisma.client.findMany({
      where: { agentId: agent.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.property.findMany({
      where: { agentId: agent.id },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);
  return { clients, properties };
}
