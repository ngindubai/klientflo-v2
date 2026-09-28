import { dubaiDateKey } from "./dubai-time";
// Pure calendar/date helpers (client + server safe). Weeks start on Monday.

export type CalendarView = "month" | "week" | "day";

export function parseView(v?: string): CalendarView {
  return v === "week" || v === "day" ? v : "month";
}

/** Parse a YYYY-MM-DD string to a local Date, or return today. */
export function parseDate(s?: string): Date {
  if (s && /^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    const parsed = new Date(y, m - 1, d);
    if (parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d) return parsed;
  }
  const [y, m, d] = dubaiDateKey(new Date()).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Value for an <input type="datetime-local">, in local time. */
export function toDateTimeLocal(d: Date): string {
  return `${toISODate(d)}T${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Monday of the week containing d. */
export function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7; // 0 = Monday
  return addDays(x, -day);
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function isSameDay(a: Date, b: Date): boolean {
  return toISODate(a) === toISODate(b);
}

export function isToday(d: Date): boolean {
  return toISODate(d) === dubaiDateKey(new Date());
}

/** Weeks (arrays of 7 Dates) covering the full month grid, Monday-aligned. */
export function monthGrid(ref: Date): Date[][] {
  const first = startOfWeek(startOfMonth(ref));
  const weeks: Date[][] = [];
  let cursor = first;
  // Always render 6 weeks for a stable grid height.
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function weekDays(ref: Date): Date[] {
  const start = startOfWeek(ref);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** The [start, end] date range visible for a given view. */
export function viewRange(view: CalendarView, ref: Date): [Date, Date] {
  if (view === "day") return [startOfDay(ref), endOfDay(ref)];
  if (view === "week") {
    const s = startOfWeek(ref);
    return [s, endOfDay(addDays(s, 6))];
  }
  const grid = monthGrid(ref);
  return [grid[0][0], endOfDay(grid[5][6])];
}

/** Step the reference date by one unit in the given view. */
export function step(view: CalendarView, ref: Date, dir: 1 | -1): Date {
  if (view === "day") return addDays(ref, dir);
  if (view === "week") return addDays(ref, dir * 7);
  return new Date(ref.getFullYear(), ref.getMonth() + dir, 1);
}

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function monthYearLabel(d: Date): string {
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}
