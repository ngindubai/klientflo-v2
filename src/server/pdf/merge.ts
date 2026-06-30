import { formatAED } from "@/lib/utils";

/** A property shape sufficient to resolve merge fields. */
export type MergeProperty = {
  title: string;
  price: number;
  area: string | null;
  community: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sizeSqft: number | null;
  propertyType: string | null;
  description: string | null;
  permitNumber: string | null;
};

export type MergeAgent = {
  name: string;
  phone: string | null;
  email: string | null;
};

/** The merge tokens offered in the editor, with a human label. */
export const MERGE_FIELDS: { token: string; label: string }[] = [
  { token: "{{property.title}}", label: "Property title" },
  { token: "{{property.price}}", label: "Price (AED)" },
  { token: "{{property.area}}", label: "Area" },
  { token: "{{property.community}}", label: "Community" },
  { token: "{{property.bedrooms}}", label: "Bedrooms" },
  { token: "{{property.bathrooms}}", label: "Bathrooms" },
  { token: "{{property.size}}", label: "Size (sqft)" },
  { token: "{{property.type}}", label: "Property type" },
  { token: "{{property.description}}", label: "Description" },
  { token: "{{property.permit}}", label: "Permit number" },
  { token: "{{agent.name}}", label: "Your name" },
  { token: "{{agent.phone}}", label: "Your phone" },
  { token: "{{agent.email}}", label: "Your email" },
];

/** Resolve {{merge}} tokens in a template body against a property + agent. */
export function resolveMergeFields(
  body: string,
  property: MergeProperty,
  agent: MergeAgent,
): string {
  const values: Record<string, string> = {
    "property.title": property.title,
    "property.price": formatAED(property.price),
    "property.area": property.area ?? "",
    "property.community": property.community ?? "",
    "property.bedrooms": property.bedrooms?.toString() ?? "",
    "property.bathrooms": property.bathrooms?.toString() ?? "",
    "property.size": property.sizeSqft ? `${property.sizeSqft.toLocaleString()} sqft` : "",
    "property.type": property.propertyType ?? "",
    "property.description": property.description ?? "",
    "property.permit": property.permitNumber ?? "",
    "agent.name": agent.name,
    "agent.phone": agent.phone ?? "",
    "agent.email": agent.email ?? "",
  };
  return body.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key: string) =>
    key in values ? values[key] : match,
  );
}
