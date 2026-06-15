import { prisma } from "@/lib/db";
import type { PropertySource } from "@/lib/constants";

// A normalised listing from an external portal.
export type ImportedListing = {
  listingId: string;
  title: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  sizeSqft?: number;
  propertyType?: string;
  area?: string;
  community?: string;
  description?: string;
  images?: string[];
  listingUrl?: string;
  permitNumber?: string;
  expiresAt?: Date;
};

// Portal adapters share this shape. Real HTTP integrations slot in behind it;
// until a broker number + portal access are configured they return nothing,
// so the app runs end-to-end on its existing inventory.
export interface ListingSource {
  readonly source: PropertySource;
  fetchListings(brokerNumber: string): Promise<ImportedListing[]>;
}

const propertyFinderAdapter: ListingSource = {
  source: "property_finder",
  async fetchListings() {
    // TODO: integrate Property Finder API once broker access is configured.
    return [];
  },
};

const bayutAdapter: ListingSource = {
  source: "bayut",
  async fetchListings() {
    // TODO: integrate Bayut API once broker access is configured.
    return [];
  },
};

const ADAPTERS: ListingSource[] = [propertyFinderAdapter, bayutAdapter];

export type RefreshResult = {
  imported: number;
  updated: number;
  expired: number;
  configured: boolean;
};

/**
 * Refresh the agent's portfolio from configured portals (Property Finder,
 * Bayut) and mark listings whose expiry has passed. Designed to run daily.
 * With no broker number set, it still performs expiry detection.
 */
export async function refreshListings(
  agentId: string,
  brokerNumber: string | null,
): Promise<RefreshResult> {
  let imported = 0;
  let updated = 0;

  if (brokerNumber) {
    for (const adapter of ADAPTERS) {
      const listings = await adapter.fetchListings(brokerNumber);
      for (const l of listings) {
        const existing = await prisma.property.findFirst({
          where: { agentId, listingId: l.listingId },
        });
        const data = {
          agentId,
          listingId: l.listingId,
          title: l.title,
          price: l.price,
          bedrooms: l.bedrooms ?? null,
          bathrooms: l.bathrooms ?? null,
          sizeSqft: l.sizeSqft ?? null,
          propertyType: l.propertyType ?? null,
          area: l.area ?? null,
          community: l.community ?? null,
          description: l.description ?? null,
          images: l.images ?? [],
          listingUrl: l.listingUrl ?? null,
          permitNumber: l.permitNumber ?? null,
          source: adapter.source,
          status: "active" as const,
          expiresAt: l.expiresAt ?? null,
        };
        if (existing) {
          await prisma.property.update({ where: { id: existing.id }, data });
          updated++;
        } else {
          await prisma.property.create({ data });
          imported++;
        }
      }
    }
  }

  // Expiry detection: any active listing whose expiry has passed becomes expired.
  const expired = await prisma.property.updateMany({
    where: { agentId, status: "active", expiresAt: { lt: new Date() } },
    data: { status: "expired" },
  });

  return {
    imported,
    updated,
    expired: expired.count,
    configured: Boolean(brokerNumber),
  };
}
