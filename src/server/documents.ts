import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import type { DealType } from "@/lib/constants";

// Client documents typically required to progress a deal, by type.
const REQUIRED_CLIENT_DOCS: Record<DealType, string[]> = {
  sale: ["passport", "emirates_id", "proof_of_funds"],
  rental: ["passport", "emirates_id", "visa"],
};

export type DocumentFilters = { q?: string; category?: string; expiry?: string };

export async function getDocuments(filters: DocumentFilters = {}) {
  const agent = await getCurrentAgent();
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 86_400_000);
  const q = filters.q?.trim();

  return prisma.document.findMany({
    where: {
      agentId: agent.id,
      ...(filters.category ? { category: filters.category as never } : {}),
      ...(filters.expiry === "expired"
        ? { expiresAt: { lt: now } }
        : filters.expiry === "soon"
          ? { expiresAt: { gte: now, lt: soon } }
          : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { type: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ category: "asc" }, { createdAt: "desc" }],
    include: {
      client: { select: { id: true, name: true } },
      property: { select: { id: true, title: true } },
      deal: { select: { id: true } },
    },
  });
}

export async function getDocument(id: string) {
  const agent = await getCurrentAgent();
  return prisma.document.findFirst({ where: { id, agentId: agent.id } });
}

export async function getDocumentFormOptions() {
  const agent = await getCurrentAgent();
  const [clients, properties, deals] = await Promise.all([
    prisma.contact.findMany({
      where: { agentId: agent.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.property.findMany({
      where: { agentId: agent.id },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    prisma.deal.findMany({
      where: { agentId: agent.id, stage: { notIn: ["closed_won", "closed_lost"] } },
      select: { id: true, type: true, client: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  return { clients, properties, deals };
}

/**
 * For each active deal awaiting documents, work out which standard client
 * documents are still missing. Powers the missing-document alerts.
 */
export async function getMissingDocuments() {
  const agent = await getCurrentAgent();
  const deals = await prisma.deal.findMany({
    where: {
      agentId: agent.id,
      stage: "documents_requested",
      clientId: { not: null },
    },
    include: { client: { include: { documents: true } } },
  });

  return deals
    .map((deal) => {
      const have = new Set(
        (deal.client?.documents ?? [])
          .filter((d) => d.category === "client")
          .map((d) => d.type),
      );
      const required = REQUIRED_CLIENT_DOCS[deal.type];
      const missing = required.filter((t) => !have.has(t));
      return { dealId: deal.id, client: deal.client, type: deal.type, missing };
    })
    .filter((m) => m.missing.length > 0);
}
