"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import { refreshListings, type RefreshResult } from "@/server/property-import";
import { buildInfoPack, type InfoPack } from "@/server/info-pack";

export type PropertyInput = {
  title: string;
  price: string;
  bedrooms?: string;
  bathrooms?: string;
  sizeSqft?: string;
  propertyType?: string;
  area?: string;
  community?: string;
  description?: string;
  listingUrl?: string;
  permitNumber?: string;
  paymentPlan?: string;
};

const clean = (v?: string) => {
  const t = v?.trim();
  return t ? t : null;
};
const num = (v?: string) => {
  const n = v ? Number(v.replace(/[^\d.]/g, "")) : NaN;
  return Number.isFinite(n) ? Math.round(n) : null;
};

function toData(input: PropertyInput) {
  return {
    title: input.title.trim(),
    price: num(input.price) ?? 0,
    bedrooms: num(input.bedrooms),
    bathrooms: num(input.bathrooms),
    sizeSqft: num(input.sizeSqft),
    propertyType: clean(input.propertyType),
    area: clean(input.area),
    community: clean(input.community),
    description: clean(input.description),
    listingUrl: clean(input.listingUrl),
    permitNumber: clean(input.permitNumber),
    paymentPlan: clean(input.paymentPlan),
  };
}

export async function createProperty(input: PropertyInput) {
  const agent = await getCurrentAgent();
  if (!input.title?.trim() || !input.price?.trim()) {
    throw new Error("Title and price are required.");
  }
  const property = await prisma.property.create({
    data: { agentId: agent.id, source: "manual", status: "active", ...toData(input) },
  });
  revalidatePath("/properties");
  redirect(`/properties/${property.id}`);
}

export async function updateProperty(id: string, input: PropertyInput) {
  const agent = await getCurrentAgent();
  const existing = await prisma.property.findFirst({
    where: { id, agentId: agent.id },
  });
  if (!existing) throw new Error("Property not found.");
  await prisma.property.update({ where: { id }, data: toData(input) });
  revalidatePath("/properties");
  revalidatePath(`/properties/${id}`);
  redirect(`/properties/${id}`);
}

export async function refreshListingsAction(): Promise<RefreshResult> {
  const agent = await getCurrentAgent();
  const settings = await prisma.settings.findUnique({
    where: { agentId: agent.id },
  });
  const result = await refreshListings(agent.id, settings?.brokerNumber ?? null);
  revalidatePath("/properties");
  return result;
}

export async function generateInfoPack(propertyIds: string[]): Promise<InfoPack> {
  const agent = await getCurrentAgent();
  const properties = await prisma.property.findMany({
    where: { id: { in: propertyIds }, agentId: agent.id },
  });
  if (properties.length === 0) throw new Error("No properties selected.");
  // Preserve the requested order.
  const ordered = propertyIds
    .map((id) => properties.find((p) => p.id === id))
    .filter((p): p is (typeof properties)[number] => Boolean(p));
  return buildInfoPack(ordered, agent.name);
}
