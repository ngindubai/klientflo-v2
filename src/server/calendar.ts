import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";

export async function getEventsInRange(start: Date, end: Date) {
  const agent = await getCurrentAgent();
  return prisma.event.findMany({
    where: { agentId: agent.id, startsAt: { gte: start, lte: end } },
    orderBy: { startsAt: "asc" },
    include: { client: true, property: true },
  });
}

export async function getEvent(id: string) {
  const agent = await getCurrentAgent();
  return prisma.event.findFirst({
    where: { id, agentId: agent.id },
    include: { client: true, property: true },
  });
}

/** Lightweight client + property lists for the event form selects. */
export async function getEventFormOptions() {
  const agent = await getCurrentAgent();
  const [clients, properties] = await Promise.all([
    prisma.contact.findMany({
      where: { agentId: agent.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.property.findMany({
      where: { agentId: agent.id, status: "active" },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);
  return { clients, properties };
}

export type EventWithLinks = Awaited<ReturnType<typeof getEventsInRange>>[number];
