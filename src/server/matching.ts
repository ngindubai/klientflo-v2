import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import { formatAED } from "@/lib/utils";
import type { ClientType } from "@/lib/constants";

// The subset of a client's requirements the matcher reasons about.
export type MatchInput = {
  clientType: ClientType | null;
  area: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  bedrooms: number | null;
  propertyType: string | null;
};

// The property fields the matcher reasons about.
export type MatchProperty = {
  price: number;
  area: string | null;
  bedrooms: number | null;
  propertyType: string | null;
};

export type MatchScore = {
  score: number; // 0-100
  reasons: string[];
  misses: string[];
};

const norm = (s: string) => s.toLowerCase().trim();
function textMatch(a: string | null, b: string | null) {
  if (!a || !b) return false;
  const x = norm(a);
  const y = norm(b);
  return x.includes(y) || y.includes(x);
}

// Buyers/sellers transact on sale prices; tenants/landlords on (annual) rents.
// We have no explicit listing type, so use a price heuristic as a soft signal.
const SALE_THRESHOLD = 500_000;

/**
 * Score how well a property matches a client's requirements (0-100), with
 * human-readable reasons and misses. Only the requirements the client actually
 * stated count toward the score, so a sparse profile still scores fairly.
 */
export function matchScore(req: MatchInput, p: MatchProperty): MatchScore {
  let total = 0;
  let earned = 0;
  const reasons: string[] = [];
  const misses: string[] = [];

  if (req.budgetMax != null) {
    total += 35;
    if (p.price <= req.budgetMax) {
      earned += 35;
      reasons.push("Within budget");
    } else if (p.price <= req.budgetMax * 1.1) {
      earned += 20;
      reasons.push("Just over budget");
    } else {
      misses.push("Over budget");
    }
  }

  if (req.area) {
    total += 25;
    if (textMatch(p.area, req.area)) {
      earned += 25;
      reasons.push(`In ${p.area}`);
    } else {
      misses.push(`Wanted ${req.area}`);
    }
  }

  if (req.bedrooms != null) {
    total += 20;
    if (p.bedrooms === req.bedrooms) {
      earned += 20;
      reasons.push(`${p.bedrooms}-bed`);
    } else if (p.bedrooms != null && Math.abs(p.bedrooms - req.bedrooms) === 1) {
      earned += 10;
      reasons.push(`${p.bedrooms}-bed (±1)`);
    } else {
      misses.push(`Wanted ${req.bedrooms}-bed`);
    }
  }

  if (req.propertyType) {
    total += 15;
    if (textMatch(p.propertyType, req.propertyType)) {
      earned += 15;
      reasons.push(p.propertyType!);
    } else {
      misses.push(`Wanted ${req.propertyType}`);
    }
  }

  // Soft sale-vs-rent signal from the client type.
  if (req.clientType) {
    total += 5;
    const wantsSale =
      req.clientType === "buyer" || req.clientType === "seller";
    const looksSale = p.price >= SALE_THRESHOLD;
    if (wantsSale === looksSale) earned += 5;
  }

  if (total === 0) {
    return {
      score: 50,
      reasons: ["No specific requirements yet"],
      misses: [],
    };
  }
  return { score: Math.round((earned / total) * 100), reasons, misses };
}

function reqFromClient(c: MatchInput): MatchInput {
  return c;
}

/** Top matching active properties for a client, scored and sorted. */
export async function getMatchingProperties(clientId: string, limit = 5) {
  const agent = await getCurrentAgent();
  const [client, properties] = await Promise.all([
    prisma.contact.findFirst({ where: { id: clientId, agentId: agent.id } }),
    prisma.property.findMany({ where: { agentId: agent.id, status: "active" } }),
  ]);
  if (!client) return [];

  const req = reqFromClient(client);
  return properties
    .map((p) => ({ property: p, match: matchScore(req, p) }))
    .filter((m) => m.match.score > 0)
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, limit);
}

/** Top matching clients for a property (reverse match), scored and sorted. */
export async function getMatchingClients(propertyId: string, limit = 5) {
  const agent = await getCurrentAgent();
  const [property, clients] = await Promise.all([
    prisma.property.findFirst({ where: { id: propertyId, agentId: agent.id } }),
    prisma.contact.findMany({ where: { agentId: agent.id } }),
  ]);
  if (!property) return [];

  return clients
    .map((c) => ({ client: c, match: matchScore(c, property) }))
    .filter((m) => m.match.score >= 50)
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, limit);
}

/** A short suggested-message line for a matched property. */
export function matchHeadline(p: MatchProperty, m: MatchScore) {
  return `${m.score}% match — ${[p.bedrooms ? `${p.bedrooms}-bed` : null, p.propertyType, p.area]
    .filter(Boolean)
    .join(" ")} at ${formatAED(p.price)}`;
}
