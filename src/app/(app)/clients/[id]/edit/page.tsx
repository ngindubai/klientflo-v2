import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { ClientForm } from "@/components/clients/client-form";
import { getClient } from "@/server/clients";
import type { ClientInput } from "@/server/client-actions";

export const dynamic = "force-dynamic";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const initial: Partial<ClientInput> = {
    name: client.name,
    phone: client.phone,
    email: client.email ?? "",
    nationality: client.nationality ?? "",
    clientType: client.clientType ?? "",
    budgetMin: client.budgetMin?.toString() ?? "",
    budgetMax: client.budgetMax?.toString() ?? "",
    area: client.area ?? "",
    bedrooms: client.bedrooms?.toString() ?? "",
    propertyType: client.propertyType ?? "",
    paymentMethod: client.paymentMethod ?? "",
    timeline: client.timeline ?? "",
    status: client.status ?? "",
    notes: client.notes ?? "",
    nextAction: client.nextAction ?? "",
  };

  return (
    <>
      <PageHeader title={`Edit ${client.name}`} />
      <Card className="max-w-3xl p-6">
        <ClientForm mode="edit" id={client.id} initial={initial} />
      </Card>
    </>
  );
}
