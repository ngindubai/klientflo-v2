import Link from "next/link";
import { EventChip } from "@/components/calendar/event-chip";
import type { EventWithLinks } from "@/server/calendar";
import {
  WEEKDAY_LABELS,
  isToday,
  toISODate,
  weekDays,
} from "@/lib/calendar";
import { cn, formatTime } from "@/lib/utils";
import { humanizeEnum } from "@/lib/constants";

function groupByDay(events: EventWithLinks[]) {
  const map = new Map<string, EventWithLinks[]>();
  for (const e of events) {
    const key = toISODate(e.startsAt);
    const list = map.get(key);
    if (list) list.push(e);
    else map.set(key, [e]);
  }
  return map;
}

const dayHref = (d: Date) => `/calendar?view=day&date=${toISODate(d)}`;

export function MonthView({
  weeks,
  refDate,
  events,
}: {
  weeks: Date[][];
  refDate: Date;
  events: EventWithLinks[];
}) {
  const byDay = groupByDay(events);
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAY_LABELS.map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-center text-xs font-medium text-foreground-muted"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flat().map((day, i) => {
          const inMonth = day.getMonth() === refDate.getMonth();
          const dayEvents = byDay.get(toISODate(day)) ?? [];
          return (
            <div
              key={i}
              className={cn(
                "min-h-24 border-b border-r border-border p-1.5 last:border-r-0",
                !inMonth && "bg-surface-muted/40",
                i % 7 === 6 && "border-r-0",
              )}
            >
              <Link
                href={dayHref(day)}
                className={cn(
                  "mb-1 inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
                  isToday(day)
                    ? "bg-primary text-primary-foreground"
                    : inMonth
                      ? "text-foreground hover:bg-surface-muted"
                      : "text-foreground-muted",
                )}
              >
                {day.getDate()}
              </Link>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((e) => (
                  <EventChip key={e.id} event={e} compact />
                ))}
                {dayEvents.length > 3 && (
                  <Link
                    href={dayHref(day)}
                    className="block px-1.5 text-xs font-medium text-foreground-muted hover:underline"
                  >
                    +{dayEvents.length - 3} more
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WeekView({
  refDate,
  events,
}: {
  refDate: Date;
  events: EventWithLinks[];
}) {
  const byDay = groupByDay(events);
  const days = weekDays(refDate);
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
      {days.map((day) => {
        const dayEvents = byDay.get(toISODate(day)) ?? [];
        return (
          <div
            key={toISODate(day)}
            className="rounded-[var(--radius-card)] border border-border bg-surface p-2"
          >
            <Link
              href={dayHref(day)}
              className="mb-2 flex items-center justify-between"
            >
              <span className="text-xs font-medium text-foreground-muted">
                {day.toLocaleDateString("en-GB", { weekday: "short" })}
              </span>
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                  isToday(day) && "bg-primary text-primary-foreground",
                )}
              >
                {day.getDate()}
              </span>
            </Link>
            <div className="space-y-1">
              {dayEvents.length === 0 ? (
                <p className="px-1 py-2 text-xs text-foreground-muted">—</p>
              ) : (
                dayEvents.map((e) => <EventChip key={e.id} event={e} compact />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DayView({ events }: { events: EventWithLinks[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface/50 p-10 text-center text-sm text-foreground-muted">
        Nothing scheduled. Use “New event” to add something.
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {events.map((e) => (
        <li key={e.id}>
          <Link
            href={`/calendar/${e.id}/edit`}
            className="flex items-start gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-3 hover:border-primary"
          >
            <div className="w-16 shrink-0 text-sm font-semibold tabular-nums">
              {formatTime(e.startsAt)}
              <div className="text-xs font-normal text-foreground-muted">
                {formatTime(e.endsAt)}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{e.title}</p>
              <p className="text-xs text-foreground-muted">
                {humanizeEnum(e.type)}
                {e.client ? ` · ${e.client.name}` : ""}
                {e.property ? ` · ${e.property.title}` : ""}
                {e.location ? ` · ${e.location}` : ""}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
