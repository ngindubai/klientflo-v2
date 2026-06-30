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

export type Report = {
  days: ReportRange;
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
};

/**
 * Aggregate WhatsApp + pipeline activity for the current agent over the last
 * `days` days. Note: messagesByCategory aggregates in JS after a ranged fetch;
 * fine for current volumes, revisit with a SQL rollup at scale (see handover).
 */
export async function getReport(days: ReportRange = 30): Promise<Report> {
  const agent = await getCurrentAgent();
  const since = new Date(Date.now() - days * 86_400_000);
  const ranged = { agentId: agent.id, createdAt: { gte: since } };

  const [
    inbound,
    outbound,
    newConversations,
    viewingsBooked,
    dealsCreated,
    messages,
    classRows,
    dealRows,
  ] = await Promise.all([
    prisma.message.count({ where: { ...ranged, direction: "inbound" } }),
    prisma.message.count({ where: { ...ranged, direction: "outbound" } }),
    prisma.conversation.count({ where: ranged }),
    prisma.event.count({
      where: { agentId: agent.id, type: "viewing", createdAt: { gte: since } },
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

  return {
    days,
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
