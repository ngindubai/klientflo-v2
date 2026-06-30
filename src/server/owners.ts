import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";

export type OwnerFilters = {
  query?: string;
  area?: string;
  building?: string;
};

export const OWNERS_PAGE_SIZE = 50;

function ownerWhere(agentId: string, filters: OwnerFilters) {
  const q = filters.query?.trim();
  return {
    agentId,
    ...(filters.area ? { area: filters.area } : {}),
    ...(filters.building ? { building: filters.building } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q } },
            { email: { contains: q, mode: "insensitive" as const } },
            { unit: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

/** Paginated owners, searchable by name/phone and filterable by area/building. */
export async function getOwners(filters: OwnerFilters = {}, page = 1) {
  const agent = await getCurrentAgent();
  return prisma.owner.findMany({
    where: ownerWhere(agent.id, filters),
    orderBy: [{ building: "asc" }, { unit: "asc" }, { name: "asc" }],
    skip: (Math.max(1, page) - 1) * OWNERS_PAGE_SIZE,
    take: OWNERS_PAGE_SIZE,
  });
}

/** Count of owners matching the filters, for pagination. */
export async function getOwnersCount(filters: OwnerFilters = {}) {
  const agent = await getCurrentAgent();
  return prisma.owner.count({ where: ownerWhere(agent.id, filters) });
}

/** Distinct areas and buildings for the filter dropdowns. */
export async function getOwnerFacets() {
  const agent = await getCurrentAgent();
  const rows = await prisma.owner.findMany({
    where: { agentId: agent.id },
    select: { area: true, building: true },
  });
  const areas = [...new Set(rows.map((r) => r.area).filter(Boolean))].sort() as string[];
  const buildings = [
    ...new Set(rows.map((r) => r.building).filter(Boolean)),
  ].sort() as string[];
  return { areas, buildings, total: rows.length };
}
