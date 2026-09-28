import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EventForm } from "@/components/calendar/event-form";
import { EventEditActions } from "@/components/calendar/event-edit-actions";
import { getEvent, getEventFormOptions } from "@/server/calendar";
import { dubaiDateTimeInput } from "@/lib/dubai-time";
import type { EventInput } from "@/server/event-actions";

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [event, options] = await Promise.all([
    getEvent(id),
    getEventFormOptions(),
  ]);
  if (!event) notFound();

  const initial: Partial<EventInput> = {
    type: event.type,
    title: event.title,
    startsAt: dubaiDateTimeInput(event.startsAt),
    endsAt: dubaiDateTimeInput(event.endsAt),
    location: event.location ?? "",
    clientId: event.clientId ?? "",
    propertyId: event.propertyId ?? "",
    notes: event.notes ?? "",
  };

  return (
    <>
      <PageHeader
        title={`Edit · ${event.title}`}
        action={<EventEditActions id={event.id} />}
      />
      <Card className="max-w-3xl p-6">
        <EventForm
          mode="edit"
          id={event.id}
          initial={initial}
          clients={options.clients}
          properties={options.properties}
        />
      </Card>
    </>
  );
}
