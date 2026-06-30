import { describe, it, expect } from "vitest";
import { resolveMergeFields, type MergeProperty, type MergeAgent } from "@/server/pdf/merge";

const property: MergeProperty = {
  title: "Marina 2-bed",
  price: 2_500_000,
  area: "Dubai Marina",
  community: "Marina Gate",
  bedrooms: 2,
  bathrooms: 3,
  sizeSqft: 1200,
  propertyType: "Apartment",
  description: "Sea view.",
  permitNumber: "RERA-123",
};

const agent: MergeAgent = {
  name: "Sarah",
  phone: "+97150",
  email: "sarah@agency.ae",
};

describe("resolveMergeFields", () => {
  it("replaces known tokens with property + agent values", () => {
    const out = resolveMergeFields(
      "{{property.title}} in {{property.area}} for {{property.price}} — {{agent.name}}",
      property,
      agent,
    );
    expect(out).toContain("Marina 2-bed");
    expect(out).toContain("Dubai Marina");
    expect(out).toContain("Sarah");
    expect(out).toMatch(/2,500,000|AED/);
  });

  it("formats size and leaves unknown tokens untouched", () => {
    const out = resolveMergeFields(
      "{{property.size}} | {{property.unknown}}",
      property,
      agent,
    );
    expect(out).toContain("1,200 sqft");
    expect(out).toContain("{{property.unknown}}");
  });

  it("renders empty string for null fields", () => {
    const out = resolveMergeFields("[{{property.community}}]", {
      ...property,
      community: null,
    }, agent);
    expect(out).toBe("[]");
  });
});
