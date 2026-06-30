import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";

export type OwnerFilters = {
  query?: string;
  area?: string;
  building?: string;
};

/** Owners for the current agent, searchable by name/phone and filterable by area/building. */
export async function getOwners(filters: OwnerFilters = {}) {
  const agent = await getCurrentAgent();
  const q = filters.query?.trim();
  return prisma.owner.findMany({
    where: {
      agentId: agent.id,
      ...(filters.area ? { area: filters.area } : {}),
      ...(filters.building ? { building: filters.building } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
              { email: { contains: q, mode: "insensitive" } },
              { unit: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ building: "asc" }, { unit: "asc" }, { name: "asc" }],
    take: 500,
  });
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
