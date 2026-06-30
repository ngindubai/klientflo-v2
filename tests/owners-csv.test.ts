import { describe, it, expect } from "vitest";
import { parseCsv, parseOwnerCsv } from "@/lib/owners-csv";

describe("parseCsv", () => {
  it("parses quoted fields with commas and escaped quotes", () => {
    const rows = parseCsv('a,b\n"x,y","he said ""hi"""\n');
    expect(rows).toEqual([
      ["a", "b"],
      ["x,y", 'he said "hi"'],
    ]);
  });

  it("ignores fully blank lines", () => {
    expect(parseCsv("a,b\n\n1,2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("parseOwnerCsv", () => {
  it("maps common header aliases", () => {
    const csv =
      "Owner Name,Mobile,Tower,Unit No,Community\nJohn Smith,+971501112222,Marina Gate,1204,Dubai Marina";
    const r = parseOwnerCsv(csv);
    expect(r.error).toBeUndefined();
    expect(r.records).toHaveLength(1);
    expect(r.records[0]).toMatchObject({
      name: "John Smith",
      phone: "+971501112222",
      building: "Marina Gate",
      unit: "1204",
      area: "Dubai Marina",
    });
  });

  it("dedupes by phone and skips rows without a name", () => {
    const csv = [
      "Name,Phone",
      "Alice,+9715000",
      "Bob,+9715000", // duplicate phone
      ",+9715111", // no name
      "Carol,+9715222",
    ].join("\n");
    const r = parseOwnerCsv(csv);
    expect(r.records.map((x) => x.name)).toEqual(["Alice", "Carol"]);
    expect(r.skipped).toBe(2);
    expect(r.total).toBe(4);
  });

  it("reports unmapped headers", () => {
    const csv = "Name,Favourite Colour\nAlice,Blue";
    const r = parseOwnerCsv(csv);
    expect(r.unmappedHeaders).toContain("Favourite Colour");
    expect(r.records).toHaveLength(1);
  });

  it("errors when there is no Name column", () => {
    const r = parseOwnerCsv("Phone,Area\n+97150,Marina");
    expect(r.error).toMatch(/Name column/i);
    expect(r.records).toHaveLength(0);
  });

  it("errors on an empty file", () => {
    expect(parseOwnerCsv("").error).toBeDefined();
  });
});
