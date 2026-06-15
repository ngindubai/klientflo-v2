import type { Property } from "@/generated/prisma/client";
import { formatAED } from "@/lib/utils";

export type InfoPackItem = {
  propertyId: string;
  title: string;
  facts: string;
  listingUrl: string | null;
  attachments: { label: string; url: string }[];
};

export type InfoPack = {
  kind: "single" | "comparison";
  message: string;
  items: InfoPackItem[];
};

function facts(p: Property) {
  return [
    p.bedrooms ? `${p.bedrooms} bed` : null,
    p.bathrooms ? `${p.bathrooms} bath` : null,
    p.sizeSqft ? `${p.sizeSqft.toLocaleString()} sqft` : null,
    p.area,
    formatAED(p.price),
  ]
    .filter(Boolean)
    .join(" · ");
}

function attachments(p: Property) {
  const out: { label: string; url: string }[] = [];
  if (p.brochureUrl) out.push({ label: "Brochure", url: p.brochureUrl });
  p.floorPlans.forEach((url, i) =>
    out.push({ label: `Floor plan${p.floorPlans.length > 1 ? ` ${i + 1}` : ""}`, url }),
  );
  if (p.paymentPlan) out.push({ label: "Payment plan", url: "(included)" });
  p.images.slice(0, 3).forEach((url, i) =>
    out.push({ label: `Photo ${i + 1}`, url }),
  );
  return out;
}

/**
 * Build a one-click information pack for one or more properties: a WhatsApp-
 * ready message plus the attachments to send. Single property vs comparison is
 * chosen by count. Actually sending lands in Chunk 12; this produces the pack.
 */
export function buildInfoPack(properties: Property[], agentName: string): InfoPack {
  const kind = properties.length > 1 ? "comparison" : "single";

  const items: InfoPackItem[] = properties.map((p) => ({
    propertyId: p.id,
    title: p.title,
    facts: facts(p),
    listingUrl: p.listingUrl,
    attachments: attachments(p),
  }));

  const lines: string[] = [];
  if (kind === "single") {
    const p = properties[0];
    lines.push(`Hi! Here are the details for *${p.title}*:`);
    lines.push("");
    lines.push(facts(p));
    if (p.description) lines.push("", p.description);
    if (p.paymentPlan) lines.push("", `Payment plan: ${p.paymentPlan}`);
    if (p.listingUrl) lines.push("", `Listing: ${p.listingUrl}`);
  } else {
    lines.push("Hi! Here are a few options I think you'll like:");
    lines.push("");
    properties.forEach((p, i) => {
      lines.push(`${i + 1}. *${p.title}* — ${facts(p)}`);
      if (p.listingUrl) lines.push(`   ${p.listingUrl}`);
    });
  }
  lines.push("", "Happy to arrange a viewing whenever suits you.");
  lines.push(`— ${agentName}`);

  return { kind, message: lines.join("\n"), items };
}
