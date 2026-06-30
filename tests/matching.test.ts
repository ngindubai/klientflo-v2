import { describe, it, expect } from "vitest";
import { matchScore, type MatchInput, type MatchProperty } from "@/server/matching";

const property: MatchProperty = {
  price: 1_900_000,
  area: "Dubai Marina",
  bedrooms: 2,
  propertyType: "Apartment",
};

describe("matchScore", () => {
  it("scores a perfect match at 100 with reasons", () => {
    const req: MatchInput = {
      clientType: "buyer",
      area: "Dubai Marina",
      budgetMin: null,
      budgetMax: 2_000_000,
      bedrooms: 2,
      propertyType: "Apartment",
    };
    const r = matchScore(req, property);
    expect(r.score).toBe(100);
    expect(r.reasons).toContain("Within budget");
    expect(r.misses).toHaveLength(0);
  });

  it("penalises over-budget and wrong area", () => {
    const req: MatchInput = {
      clientType: "buyer",
      area: "Downtown Dubai",
      budgetMin: null,
      budgetMax: 1_000_000,
      bedrooms: 2,
      propertyType: "Apartment",
    };
    const r = matchScore(req, property);
    expect(r.score).toBeLessThan(60);
    expect(r.misses).toContain("Over budget");
    expect(r.misses).toContain("Wanted Downtown Dubai");
  });

  it("gives partial credit just over budget and ±1 bedroom", () => {
    const req: MatchInput = {
      clientType: null,
      area: null,
      budgetMin: null,
      budgetMax: 1_800_000, // property 1.9M is within 10%
      bedrooms: 3, // property is 2-bed (±1)
      propertyType: null,
    };
    const r = matchScore(req, property);
    expect(r.reasons).toContain("Just over budget");
    expect(r.reasons).toContain("2-bed (±1)");
    expect(r.score).toBeGreaterThan(0);
    expect(r.score).toBeLessThan(100);
  });

  it("returns a neutral 50 when no requirements are stated", () => {
    const req: MatchInput = {
      clientType: null,
      area: null,
      budgetMin: null,
      budgetMax: null,
      bedrooms: null,
      propertyType: null,
    };
    expect(matchScore(req, property).score).toBe(50);
  });
});
