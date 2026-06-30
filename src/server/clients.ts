import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import type { ContactCategory } from "@/lib/constants";
import type { Prisma } from "@/generated/prisma/client";

export const CONTACTS_PAGE_SIZE = 30;

export type ContactFilters = { query?: string; area?: string };

function contactWhere(
  agentId: string,
  category: ContactCategory,
  filters: ContactFilters = {},
): Prisma.ContactWhereInput {
  const { query, area } = filters;
  return {
    agentId,
    category,
    ...(area ? { area } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { phone: { contains: query } },
            { email: { contains: query, mode: "insensitive" } },
            { area: { contains: query, mode: "insensitive" } },
            { agencyName: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

/**
 * Paginated contacts for the current agent, with a derived max-urgency from
 * their conversations. Defaults to the `client` category so the Clients section
 * shows only clients; the Agents / Investors sections reuse this.
 */
export async function getClients(
  filters: ContactFilters = {},
  category: ContactCategory = "client",
  page = 1,
) {
  const agent = await getCurrentAgent();
  const clients = await prisma.contact.findMany({
    where: contactWhere(agent.id, category, filters),
    orderBy: { updatedAt: "desc" },
    include: { conversations: { select: { urgency: true } } },
    skip: (Math.max(1, page) - 1) * CONTACTS_PAGE_SIZE,
    take: CONTACTS_PAGE_SIZE,
  });

  return clients.map((c) => ({
    ...c,
    maxUrgency: c.conversations.reduce((m, conv) => Math.max(m, conv.urgency), 0),
  }));
}

/** Count of contacts matching a category + filters, for pagination. */
export async function getContactsCount(
  filters: ContactFilters = {},
  category: ContactCategory = "client",
) {
  const agent = await getCurrentAgent();
  return prisma.contact.count({
    where: contactWhere(agent.id, category, filters),
  });
}

/** Distinct areas present for a category, for the filter dropdown. */
export async function getContactAreas(category: ContactCategory = "client") {
  const agent = await getCurrentAgent();
  const rows = await prisma.contact.findMany({
    where: { agentId: agent.id, category, NOT: { area: null } },
    select: { area: true },
    distinct: ["area"],
    orderBy: { area: "asc" },
  });
  return rows.map((r) => r.area).filter(Boolean) as string[];
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

/** Brief contact list (any category, with a phone) for recipient pickers. */
export async function getContactsBrief() {
  const agent = await getCurrentAgent();
  return prisma.contact.findMany({
    where: { agentId: agent.id, NOT: { category: "spam" } },
    select: { id: true, name: true, phone: true, category: true },
    orderBy: { name: "asc" },
  });
}
