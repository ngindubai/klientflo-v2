// Pure aggregation helpers for the reports page, so they can be unit-tested
// independently of Prisma.

export function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export type TimedMessage = {
  conversationId: string;
  direction: "inbound" | "outbound";
  createdAt: Date;
};

/**
 * Median first-response time, in minutes, from an inbound message to the next
 * outbound reply within the same conversation. Returns 0 when there are no
 * answered inbound messages.
 */
export function medianResponseMinutes(messages: TimedMessage[]): number {
  const byConv = new Map<string, TimedMessage[]>();
  for (const m of messages) {
    const arr = byConv.get(m.conversationId);
    if (arr) arr.push(m);
    else byConv.set(m.conversationId, [m]);
  }

  const deltas: number[] = [];
  for (const arr of byConv.values()) {
    arr.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    let awaitingSince: number | null = null;
    for (const m of arr) {
      if (m.direction === "inbound") {
        if (awaitingSince === null) awaitingSince = m.createdAt.getTime();
      } else if (awaitingSince !== null) {
        deltas.push((m.createdAt.getTime() - awaitingSince) / 60_000);
        awaitingSince = null;
      }
    }
  }
  return Math.round(median(deltas));
}

/** Tally message counts per contact category, keeping only non-empty buckets. */
export function rollupByCategory(
  categories: string[],
  order: readonly string[],
): { category: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const c of categories) counts.set(c, (counts.get(c) ?? 0) + 1);
  return [...order, "untagged"]
    .map((category) => ({ category, count: counts.get(category) ?? 0 }))
    .filter((r) => r.count > 0);
}

/** Human-friendly duration from minutes, e.g. 0, 45m, 2h 15m, 1d 3h. */
export function formatMinutes(min: number): string {
  if (min <= 0) return "—";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) {
    const m = min % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh ? `${d}d ${rh}h` : `${d}d`;
}
