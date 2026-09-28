import { describe, it, expect } from "vitest";
import { parseDubaiDateTime, dubaiDateTimeInput, dubaiDateKey, validateEventTimes } from "@/lib/dubai-time";
import { monthGrid, parseDate, toISODate, step } from "@/lib/calendar";
describe("Dubai calendar times", () => {
  it("round trips an appointment independently of server timezone", () => {
    const start = parseDubaiDateTime("2026-09-29T10:30");
    expect(start.toISOString()).toBe("2026-09-29T06:30:00.000Z");
    expect(dubaiDateTimeInput(start)).toBe("2026-09-29T10:30");
  });
  it("places UTC evening events on the next Dubai day", () => expect(dubaiDateKey(new Date("2026-09-28T21:30:00Z"))).toBe("2026-09-29"));
  it.each(["2026-02-30T10:00", "invalid", "2026-09-29T25:00"])("rejects invalid input %s", value => expect(() => parseDubaiDateTime(value)).toThrow());
  it("rejects reversed or zero-length appointments", () => {
    const start = parseDubaiDateTime("2026-09-29T10:30");
    expect(() => validateEventTimes(start, start)).toThrow("after");
    expect(() => validateEventTimes(start, new Date(start.getTime() - 60000))).toThrow("after");
  });
  it("shows 42 days and steps across year boundaries", () => {
    expect(monthGrid(parseDate("2026-09-29")).flat()).toHaveLength(42);
    expect(toISODate(step("month", parseDate("2026-12-31"), 1))).toBe("2027-01-01");
  });
});
