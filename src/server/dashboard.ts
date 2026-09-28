import { priorityWhere } from "@/server/inbox-query";
import { dubaiDateKey } from "@/lib/dubai-time";
import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";

function todayRange() {
  const key = dubaiDateKey(new Date());
  const start = new Date(`${key}T00:00:00+04:00`);
  const end = new Date(`${key}T23:59:59.999+04:00`);
  return { start, end };
}

/**
 * Fetches everything the dashboard needs in a single round of parallel
 * queries, scoped to the current agent.
 */
export async function getDashboardData() {
  const agent = await getCurrentAgent();
  const agentId = agent.id;
  const { start, end } = todayRange();
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);

  const [
    urgentMessages,
    hotLeads,
    pendingReplies,
    suggestedActions,
    todaysViewings,
    todaysMeetings,
    dealsNeedingAttention,
    dealsAwaitingDocs,
    expiringDocuments,
    newVoiceNotes,
    counts,
  ] = await Promise.all([
    // Urgent messages — urgency 4–5, most pressing first.
    prisma.conversation.findMany({
      where: { agentId, ...priorityWhere("high") },
      orderBy: [{ urgency: "desc" }, { lastMessageAt: "desc" }],
      take: 6,
      include: { client: true },
    }),
    // Hot leads — strong intent classifications.
    prisma.conversation.findMany({
      where: {
        agentId,
        classification: {
          in: ["hot_lead", "viewing_request", "price_negotiation"],
        },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 6,
      include: { client: true },
    }),
    // Conversations awaiting a reply — oldest first.
    prisma.conversation.findMany({
      where: { agentId, awaitingReply: true },
      orderBy: { lastMessageAt: "asc" },
      take: 6,
      include: { client: true },
    }),
    // AI suggested actions still pending.
    prisma.suggestedAction.findMany({
      where: { agentId, status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { client: true },
    }),
    // Today's viewings.
    prisma.event.findMany({
      where: { agentId, type: "viewing", startsAt: { gte: start, lte: end } },
      orderBy: { startsAt: "asc" },
      include: { client: true, property: true },
    }),
    // Today's meetings (office + trustee office).
    prisma.event.findMany({
      where: {
        agentId,
        type: { in: ["office_meeting", "trustee_office_meeting"] },
        startsAt: { gte: start, lte: end },
      },
      orderBy: { startsAt: "asc" },
      include: { client: true },
    }),
    // Active deals (anything not closed).
    prisma.deal.findMany({
      where: { agentId, stage: { notIn: ["closed_won", "closed_lost"] } },
      orderBy: { updatedAt: "asc" },
      take: 6,
      include: { client: true, property: true },
    }),
    // Deals explicitly awaiting documents.
    prisma.deal.findMany({
      where: { agentId, stage: "documents_requested" },
      include: { client: true },
    }),
    // Documents expiring within 30 days.
    prisma.document.findMany({
      where: { agentId, expiresAt: { gte: start, lte: soon } },
      orderBy: { expiresAt: "asc" },
      include: { client: true },
    }),
    // Voice notes awaiting review.
    prisma.message.findMany({
      where: { agentId, type: "voice", reviewed: false },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { conversation: { include: { client: true } } },
    }),
    // Headline counts for the stat row.
    Promise.all([
      prisma.conversation.count({ where: { agentId, ...priorityWhere("high") } }),
      prisma.conversation.count({ where: { agentId, awaitingReply: true } }),
      prisma.suggestedAction.count({ where: { agentId, status: "pending" } }),
      prisma.message.count({
        where: { agentId, type: "voice", reviewed: false },
      }),
    ]).then(([urgent, pending, actions, voice]) => ({
      urgent,
      pending,
      actions,
      voice,
    })),
  ]);

  return {
    agent,
    urgentMessages,
    hotLeads,
    pendingReplies,
    suggestedActions,
    todaysViewings,
    todaysMeetings,
    dealsNeedingAttention,
    dealsAwaitingDocs,
    expiringDocuments,
    newVoiceNotes,
    counts,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
