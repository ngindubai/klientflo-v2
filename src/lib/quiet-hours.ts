// Pure quiet-hours evaluation.

type QuietHoursConfig = {
  quietHoursStart: string | null; // "HH:mm"
  quietHoursEnd: string | null;
  quietHoursDays: number[]; // 0=Sun .. 6=Sat; empty = every day
};

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Whether `now` falls within the agent's configured quiet hours. */
export function isWithinQuietHours(
  config: QuietHoursConfig,
  now: Date = new Date(),
): boolean {
  if (!config.quietHoursStart || !config.quietHoursEnd) return false;

  // Empty days list means quiet hours apply every day.
  if (config.quietHoursDays.length > 0 && !config.quietHoursDays.includes(now.getDay())) {
    return false;
  }

  const start = toMinutes(config.quietHoursStart);
  const end = toMinutes(config.quietHoursEnd);
  if (start === null || end === null) return false;

  const cur = now.getHours() * 60 + now.getMinutes();
  // Same-day window vs overnight window (start > end, e.g. 21:00–08:00).
  return start <= end ? cur >= start && cur < end : cur >= start || cur < end;
}
