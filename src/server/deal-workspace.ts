import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import { dubaiDateKey } from "@/lib/dubai-time";

export async function getDealWorkspace(id: string) {
  const agent = await getCurrentAgent();
  const deal = await prisma.deal.findFirst({
    where: { id, agentId: agent.id },
    include: {
      client: { select: { id: true, name: true, phone: true } },
      property: { select: { id: true, title: true } },
      tasks: { orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }] },
      activity: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!deal) return null;
  const [documents, events, conversations] = await Promise.all([
    prisma.document.findMany({
      where: { agentId: agent.id, OR: [
        { dealId: id },
        ...(deal.clientId ? [{ dealId: null, clientId: deal.clientId, category: "client" as const }] : []),
        ...(deal.propertyId ? [{ dealId: null, propertyId: deal.propertyId, category: "property" as const }] : []),
      ] },
      select: { id: true, name: true, type: true, category: true, dealId: true, fileUrl: true, expiresAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.event.findMany({
      where: { agentId: agent.id, dealId: id },
      select: { id: true, title: true, startsAt: true, endsAt: true },
      orderBy: { startsAt: "desc" }, take: 30,
    }),
    deal.clientId ? prisma.conversation.findMany({
      where: { agentId: agent.id, clientId: deal.clientId },
      select: { id: true, contactName: true, summary: true },
      orderBy: { lastMessageAt: "desc" }, take: 5,
    }) : [],
  ]);
  return {
    id: deal.id, type: deal.type, stage: deal.stage, amount: deal.amount,
    notes: deal.notes, client: deal.client, property: deal.property,
    owner: agent.name, today: dubaiDateKey(new Date()), now: new Date().toISOString(), createdAt: deal.createdAt.toISOString(),
    tasks: deal.tasks.map(t => ({
      id: t.id, title: t.title, notes: t.notes, assignee: t.assignee, stage: t.stage,
      dueDate: t.dueAt?.toISOString().slice(0, 10) ?? null, status: t.status,
      blocked: t.blocked, suggested: t.templateKey !== null,
    })),
    activity: deal.activity.map(a => ({ id: a.id, summary: a.summary, createdAt: a.createdAt.toISOString() })),
    documents: documents.map(d => ({ ...d, expiresAt: d.expiresAt?.toISOString().slice(0, 10) ?? null })),
    events: events.map(e => ({ ...e, startsAt: e.startsAt.toISOString(), endsAt: e.endsAt.toISOString() })),
    conversations,
  };
}

export type DealWorkspaceData = NonNullable<Awaited<ReturnType<typeof getDealWorkspace>>>;
