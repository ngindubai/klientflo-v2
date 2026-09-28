import { PageHeader } from "@/components/layout/page-header";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { MonthView, WeekView, DayView } from "@/components/calendar/views";
import { getEventsInRange } from "@/server/calendar";
import {
  toISODate,
  parseView,
  parseDate,
  viewRange,
  monthGrid,
} from "@/lib/calendar";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const { view: viewParam, date: dateParam } = await searchParams;
  const view = parseView(viewParam);
  const refDate = parseDate(dateParam);
  const [start, end] = viewRange(view, refDate);
  const events = await getEventsInRange(new Date(`${toISODate(start)}T00:00:00+04:00`), new Date(`${toISODate(end)}T23:59:59.999+04:00`));

  return (
    <>
      <PageHeader
        title="Viewings & calendar"
        description="Viewings, meetings, signings and handovers · All times are Dubai (GMT+4)."
      />
      <CalendarToolbar view={view} refDate={refDate} />
      {view === "month" && (
        <MonthView weeks={monthGrid(refDate)} refDate={refDate} events={events} />
      )}
      {view === "week" && <WeekView refDate={refDate} events={events} />}
      {view === "day" && <DayView events={events} />}
    </>
  );
}
