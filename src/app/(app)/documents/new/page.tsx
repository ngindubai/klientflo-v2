import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { UploadForm } from "@/components/documents/upload-form";
import { getDocumentFormOptions } from "@/server/documents";
import { getDealWorkspace } from "@/server/deal-workspace";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewDocumentPage({ searchParams }: { searchParams: Promise<{ dealId?: string }> }) {
  const { dealId } = await searchParams;
  const deal = dealId ? await getDealWorkspace(dealId) : null;
  if (dealId && !deal) notFound();
  const { clients, properties, deals } = await getDocumentFormOptions(dealId);
  return (
    <>
      <PageHeader title="Upload document" description="Stored securely and linked to a client, deal or property." />
      <Card className="max-w-3xl p-6">
        {deal && <Link href={`/deals/${deal.id}`} className="mb-4 block text-sm text-primary">← Back to {deal.client?.name ?? "this deal"}</Link>}
        <UploadForm clients={clients} properties={properties} deals={deals} initial={deal ? { dealId: deal.id, clientId: deal.client?.id, propertyId: deal.property?.id } : undefined} />
      </Card>
    </>
  );
}
