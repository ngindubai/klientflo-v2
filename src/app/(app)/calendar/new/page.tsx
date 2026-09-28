import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EventForm } from "@/components/calendar/event-form";
import { getEventFormOptions } from "@/server/calendar";
import { parseDate, toDateTimeLocal } from "@/lib/calendar";
import { getDealWorkspace } from "@/server/deal-workspace";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; dealId?: string }>;
}) {
  const { date, dealId } = await searchParams;
  const deal = dealId ? await getDealWorkspace(dealId) : null;
  if (dealId && !deal) notFound();
  const { clients, properties } = await getEventFormOptions();

  // Default the start to 10:00 on the selected day.
  const start = parseDate(date);
  start.setHours(10, 0, 0, 0);

  return (
    <>
      <PageHeader title="New event" />
      <Card className="max-w-3xl p-6">
        {deal && <Link href={`/deals/${deal.id}`} className="mb-4 block text-sm text-primary">← Back to {deal.client?.name ?? "this deal"}</Link>}
        <EventForm
          mode="create"
          initial={{ startsAt: toDateTimeLocal(start), dealId: deal?.id, clientId: deal?.client?.id, propertyId: deal?.property?.id }}
          clients={clients}
          properties={properties}
        />
      </Card>
    </>
  );
}
