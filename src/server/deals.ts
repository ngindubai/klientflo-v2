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

/**
 * Deal Rooms view — every deal (sale + rental) as a "room", grouped by
 * lifecycle state rather than kanban stage. This is the workflow-first lens
 * on the pipeline: what's live, what's closing, what's done.
 */
export async function getOpportunities() {
  const agent = await getCurrentAgent();
  const deals = await prisma.deal.findMany({
    where: { agentId: agent.id },
    include: { client: true, property: true },
    orderBy: { updatedAt: "desc" },
  });

  const isWon = (s: string) => s === "closed_won";
  const isLost = (s: string) => s === "closed_lost";
  // "Closing" = late-stage but not yet terminal.
  const CLOSING = new Set([
    "offer_accepted",
    "documents_requested",
    "form_f_mou",
    "deposit_stage",
    "trustee_office_booked",
    "transfer_completed",
    "contract_preparation",
    "cheques_collected",
    "ejari_stage",
    "handover",
  ]);

  const decorate = (
    d: (typeof deals)[number],
  ): OpportunityCard => ({
    id: d.id,
    type: d.type as DealType,
    stage: d.stage,
    stageLabel: humanizeEnum(d.stage),
    amount: d.amount,
    updatedAt: d.updatedAt,
    client: d.client ? { id: d.client.id, name: d.client.name } : null,
    property: d.property
      ? { id: d.property.id, title: d.property.title }
      : null,
  });

  const groups = {
    closing: [] as OpportunityCard[],
    active: [] as OpportunityCard[],
    won: [] as OpportunityCard[],
    lost: [] as OpportunityCard[],
  };
  for (const d of deals) {
    const card = decorate(d);
    if (isWon(d.stage)) groups.won.push(card);
    else if (isLost(d.stage)) groups.lost.push(card);
    else if (CLOSING.has(d.stage)) groups.closing.push(card);
    else groups.active.push(card);
  }

  return { groups, count: deals.length };
}

export type OpportunityCard = {
  id: string;
  type: DealType;
  stage: string;
  stageLabel: string;
  amount: number | null;
  updatedAt: Date;
  client: { id: string; name: string } | null;
  property: { id: string; title: string } | null;
};

export async function getDealFormOptions() {
  const agent = await getCurrentAgent();
  const [clients, properties] = await Promise.all([
    prisma.contact.findMany({
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
