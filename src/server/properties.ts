import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";

export type PropertyFilters = {
  q?: string;
  area?: string;
  bedrooms?: number;
  maxPrice?: number;
  status?: "active" | "expired" | "draft";
};

export async function getProperties(filters: PropertyFilters = {}) {
  const agent = await getCurrentAgent();
  return prisma.property.findMany({
    where: {
      agentId: agent.id,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.area
        ? { area: { contains: filters.area, mode: "insensitive" } }
        : {}),
      ...(filters.bedrooms !== undefined ? { bedrooms: filters.bedrooms } : {}),
      ...(filters.maxPrice !== undefined
        ? { price: { lte: filters.maxPrice } }
        : {}),
      ...(filters.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: "insensitive" } },
              { area: { contains: filters.q, mode: "insensitive" } },
              { community: { contains: filters.q, mode: "insensitive" } },
              { listingId: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });
}

/** Distinct property areas for the filter dropdown. */
export async function getPropertyAreas() {
  const agent = await getCurrentAgent();
  const rows = await prisma.property.findMany({
    where: { agentId: agent.id, NOT: { area: null } },
    select: { area: true },
    distinct: ["area"],
    orderBy: { area: "asc" },
  });
  return rows.map((r) => r.area).filter(Boolean) as string[];
}

/** Minimal id + title list for dropdowns (template preview, media linking). */
export async function getPropertyOptions() {
  const agent = await getCurrentAgent();
  return prisma.property.findMany({
    where: { agentId: agent.id },
    select: { id: true, title: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getProperty(id: string) {
  const agent = await getCurrentAgent();
  return prisma.property.findFirst({
    where: { id, agentId: agent.id },
    include: {
      deals: { include: { client: true } },
      events: { include: { client: true }, orderBy: { startsAt: "asc" } },
    },
  });
}
