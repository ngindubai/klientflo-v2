import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import { CONTACT_CATEGORIES } from "@/lib/constants";
import {
  medianResponseMinutes,
  rollupByCategory,
  type TimedMessage,
} from "@/lib/reporting-calc";

export const REPORT_RANGES = [7, 30, 90] as const;
export type ReportRange = (typeof REPORT_RANGES)[number];

export type ReportWindow = { days?: ReportRange; from?: string; to?: string };

/** Resolve a preset (days) or an explicit from/to into a date window + label. */
export function resolveWindow(win: ReportWindow): {
  since: Date;
  until: Date | null;
  label: string;
} {
  const now = Date.now();
  if (win.from || win.to) {
    const since = win.from
      ? new Date(`${win.from}T00:00:00`)
      : new Date(now - 30 * 86_400_000);
    const until = win.to ? new Date(`${win.to}T23:59:59`) : null;
    const fmt = (d: Date) => d.toLocaleDateString("en-GB");
    return {
      since,
      until,
      label: `${fmt(since)} – ${until ? fmt(until) : "now"}`,
    };
  }
  const days = win.days ?? 30;
  return {
    since: new Date(now - days * 86_400_000),
    until: null,
    label: `Last ${days} days`,
  };
}

export type Report = {
  label: string;
  kpis: {
    messagesTotal: number;
    inbound: number;
    outbound: number;
    newConversations: number;
    viewingsBooked: number;
    dealsCreated: number;
    medianResponseMinutes: number;
  };
  messagesByCategory: { category: string; count: number }[];
  conversationsByClassification: { classification: string; count: number }[];
  pipeline: { type: string; stage: string; count: number }[];
  dealsByType: { type: string; count: number }[];
  dealOutcomes: { won: number; lost: number; open: number };
  pipelineValue: number;
  topAreas: { area: string; count: number }[];
};

/**
 * Aggregate WhatsApp + pipeline activity for the current agent over the last
 * `days` days. Note: messagesByCategory aggregates in JS after a ranged fetch;
 * fine for current volumes, revisit with a SQL rollup at scale (see handover).
 */
export async function getReport(win: ReportWindow = {}): Promise<Report> {
  const agent = await getCurrentAgent();
  const { since, until, label } = resolveWindow(win);
  const createdAt = { gte: since, ...(until ? { lte: until } : {}) };
  const ranged = { agentId: agent.id, createdAt };

  const [
    inbound,
    outbound,
    newConversations,
    viewingsBooked,
    dealsCreated,
    messages,
    classRows,
    dealRows,
    pipelineAgg,
    areaRows,
  ] = await Promise.all([
    prisma.message.count({ where: { ...ranged, direction: "inbound" } }),
    prisma.message.count({ where: { ...ranged, direction: "outbound" } }),
    prisma.conversation.count({ where: ranged }),
    prisma.event.count({
      where: { agentId: agent.id, type: "viewing", createdAt },
    }),
    prisma.deal.count({ where: ranged }),
    prisma.message.findMany({
      where: ranged,
      select: {
        direction: true,
        conversationId: true,
        createdAt: true,
        conversation: { select: { client: { select: { category: true } } } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.conversation.groupBy({
      by: ["classification"],
      where: ranged,
      _count: { _all: true },
    }),
    prisma.deal.groupBy({
      by: ["type", "stage"],
      where: { agentId: agent.id },
      _count: { _all: true },
    }),
    prisma.deal.aggregate({
      where: {
        agentId: agent.id,
        stage: { notIn: ["closed_won", "closed_lost"] },
      },
      _sum: { amount: true },
    }),
    prisma.contact.groupBy({
      by: ["area"],
      where: { agentId: agent.id, NOT: { area: null }, category: "client" },
      _count: { _all: true },
    }),
  ]);

  // Messages by contact tag (untagged contacts bucket as "untagged").
  const messagesByCategory = rollupByCategory(
    messages.map((m) => m.conversation?.client?.category ?? "untagged"),
    CONTACT_CATEGORIES,
  );

  // Median time from an inbound message to the next outbound reply.
  const timed: TimedMessage[] = messages.map((m) => ({
    conversationId: m.conversationId,
    direction: m.direction,
    createdAt: m.createdAt,
  }));
  const medianResponse = medianResponseMinutes(timed);

  const conversationsByClassification = classRows
    .filter((r) => r.classification)
    .map((r) => ({
      classification: r.classification as string,
      count: r._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const pipeline = dealRows
    .map((r) => ({ type: r.type, stage: r.stage, count: r._count._all }))
    .sort((a, b) => b.count - a.count);

  // Deals by type + win/loss outcomes (snapshot across all deals).
  const byType = new Map<string, number>();
  let won = 0;
  let lost = 0;
  let totalDeals = 0;
  for (const r of dealRows) {
    byType.set(r.type, (byType.get(r.type) ?? 0) + r._count._all);
    totalDeals += r._count._all;
    if (r.stage === "closed_won") won += r._count._all;
    if (r.stage === "closed_lost") lost += r._count._all;
  }
  const dealsByType = [...byType.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
  const dealOutcomes = { won, lost, open: totalDeals - won - lost };

  const topAreas = areaRows
    .map((r) => ({ area: r.area as string, count: r._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    label,
    dealsByType,
    dealOutcomes,
    pipelineValue: pipelineAgg._sum.amount ?? 0,
    topAreas,
    kpis: {
      messagesTotal: inbound + outbound,
      inbound,
      outbound,
      newConversations,
      viewingsBooked,
      dealsCreated,
      medianResponseMinutes: medianResponse,
    },
    messagesByCategory,
    conversationsByClassification,
    pipeline,
  };
}
