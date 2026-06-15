import { PageHeader } from "@/components/layout/page-header";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { MonthView, WeekView, DayView } from "@/components/calendar/views";
import { getEventsInRange } from "@/server/calendar";
import {
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
  const events = await getEventsInRange(start, end);

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Viewings, meetings, trustee appointments, signings and handovers."
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
