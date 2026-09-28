import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  parseDate,
  type CalendarView,
  monthYearLabel,
  step,
  toISODate,
  startOfWeek,
  addDays,
} from "@/lib/calendar";
import { DateJump } from "./date-jump";
import { cn } from "@/lib/utils";

const VIEWS: CalendarView[] = ["month", "week", "day"];

function linkTo(view: CalendarView, date: Date) {
  return `/calendar?view=${view}&date=${toISODate(date)}`;
}

function rangeLabel(view: CalendarView, refDate: Date) {
  if (view === "month") return monthYearLabel(refDate);
  if (view === "day")
    return refDate.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const s = startOfWeek(refDate);
  const e = addDays(s, 6);
  return `${s.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${e.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
}

export function CalendarToolbar({
  view,
  refDate,
}: {
  view: CalendarView;
  refDate: Date;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg border border-border">
          <Link
            href={linkTo(view, step(view, refDate, -1))}
            className="rounded-l-lg p-2 hover:bg-surface-muted"
            aria-label="Previous"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <Link
            href={linkTo(view, step(view, refDate, 1))}
            className="rounded-r-lg border-l border-border p-2 hover:bg-surface-muted"
            aria-label="Next"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
        <Link
          href={linkTo(view, parseDate())}
          className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted"
        >
          Today
        </Link>
        <h2 className="text-base font-semibold md:ml-1 md:text-lg">{rangeLabel(view, refDate)}</h2>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DateJump view={view} date={toISODate(refDate)} />
        <div className="flex items-center rounded-lg border border-border p-0.5">
          {VIEWS.map((v) => (
            <Link
              key={v}
              href={linkTo(v, refDate)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium capitalize",
                v === view
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground-muted hover:bg-surface-muted",
              )}
            >
              {v}
            </Link>
          ))}
        </div>
        <Link
          href={`/calendar/new?date=${toISODate(refDate)}`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="size-4" /> New viewing / event
        </Link>
      </div>
    </div>
  );
}
