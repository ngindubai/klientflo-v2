/** The workspace serves UAE property teams; keep times stable across hosting/browser zones. */
export const WORKSPACE_TIME_ZONE = "Asia/Dubai";
export function dubaiDateKey(date: Date) { return new Intl.DateTimeFormat("en-CA", { timeZone: WORKSPACE_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date); }
export function dubaiDateTimeInput(date: Date) {
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: WORKSPACE_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  return `${dubaiDateKey(date)}T${time}`;
}
export function parseDubaiDateTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("Enter a valid date and time.");
  const date = new Date(`${value}:00+04:00`);
  if (Number.isNaN(date.getTime()) || dubaiDateTimeInput(date) !== value) throw new Error("Enter a valid date and time.");
  return date;
}
export function validateEventTimes(start: Date, end: Date) {
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new Error("Enter a valid date and time.");
  if (end <= start) throw new Error("The end time must be after the start time.");
}
