import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import type { ContactCategory } from "@/lib/constants";

/**
 * Contacts for the current agent, with a derived max-urgency from their
 * conversations. Defaults to the `client` category so the Clients section shows
 * only clients; the Agents / Investors sections reuse this with their category.
 */
export async function getClients(
  query?: string,
  category: ContactCategory = "client",
) {
  const agent = await getCurrentAgent();
  const clients = await prisma.contact.findMany({
    where: {
      agentId: agent.id,
      category,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { phone: { contains: query } },
              { email: { contains: query, mode: "insensitive" } },
              { area: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: { conversations: { select: { urgency: true } } },
  });

  return clients.map((c) => ({
    ...c,
    maxUrgency: c.conversations.reduce((m, conv) => Math.max(m, conv.urgency), 0),
  }));
}

/** A single client with everything linked to it. */
export async function getClient(id: string) {
  const agent = await getCurrentAgent();
  return prisma.contact.findFirst({
    where: { id, agentId: agent.id },
    include: {
      conversations: {
        orderBy: { lastMessageAt: "desc" },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      },
      deals: { include: { property: true }, orderBy: { updatedAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { startsAt: "asc" } },
    },
  });
}

export type ClientWithUrgency = Awaited<ReturnType<typeof getClients>>[number];
