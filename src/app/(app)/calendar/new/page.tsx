import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EventForm } from "@/components/calendar/event-form";
import { getEventFormOptions } from "@/server/calendar";
import { parseDate, toDateTimeLocal } from "@/lib/calendar";

export const dynamic = "force-dynamic";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const { clients, properties } = await getEventFormOptions();

  // Default the start to 10:00 on the selected day.
  const start = parseDate(date);
  start.setHours(10, 0, 0, 0);

  return (
    <>
      <PageHeader title="New event" />
      <Card className="max-w-3xl p-6">
        <EventForm
          mode="create"
          initial={{ startsAt: toDateTimeLocal(start) }}
          clients={clients}
          properties={properties}
        />
      </Card>
    </>
  );
}
