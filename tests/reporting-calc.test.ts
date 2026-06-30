import { describe, it, expect } from "vitest";
import {
  median,
  medianResponseMinutes,
  rollupByCategory,
  formatMinutes,
  type TimedMessage,
} from "@/lib/reporting-calc";

describe("median", () => {
  it("handles odd and even lengths and empty", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([])).toBe(0);
  });
});

describe("medianResponseMinutes", () => {
  const d = (min: number) => new Date(2026, 0, 1, 12, min, 0);

  it("measures inbound→next-outbound per conversation", () => {
    const msgs: TimedMessage[] = [
      { conversationId: "a", direction: "inbound", createdAt: d(0) },
      { conversationId: "a", direction: "outbound", createdAt: d(10) }, // 10m
      { conversationId: "b", direction: "inbound", createdAt: d(0) },
      { conversationId: "b", direction: "outbound", createdAt: d(30) }, // 30m
    ];
    expect(medianResponseMinutes(msgs)).toBe(20);
  });

  it("ignores inbound messages that never got a reply", () => {
    const msgs: TimedMessage[] = [
      { conversationId: "a", direction: "inbound", createdAt: d(0) },
      { conversationId: "a", direction: "outbound", createdAt: d(5) }, // 5m
      { conversationId: "a", direction: "inbound", createdAt: d(50) }, // no reply
    ];
    expect(medianResponseMinutes(msgs)).toBe(5);
  });

  it("returns 0 when there are no answered inbounds", () => {
    expect(
      medianResponseMinutes([
        { conversationId: "a", direction: "inbound", createdAt: d(0) },
      ]),
    ).toBe(0);
  });
});

describe("rollupByCategory", () => {
  it("tallies and keeps category order, dropping empty buckets", () => {
    const r = rollupByCategory(
      ["client", "client", "investor", "untagged"],
      ["client", "agent", "investor", "spam", "personal"],
    );
    expect(r).toEqual([
      { category: "client", count: 2 },
      { category: "investor", count: 1 },
      { category: "untagged", count: 1 },
    ]);
  });
});

describe("formatMinutes", () => {
  it("formats durations", () => {
    expect(formatMinutes(0)).toBe("—");
    expect(formatMinutes(45)).toBe("45m");
    expect(formatMinutes(135)).toBe("2h 15m");
    expect(formatMinutes(120)).toBe("2h");
    expect(formatMinutes(1620)).toBe("1d 3h");
  });
});
