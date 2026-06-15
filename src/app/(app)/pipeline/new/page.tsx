import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { DealForm } from "@/components/pipeline/deal-form";
import { getDealFormOptions } from "@/server/deals";

export const dynamic = "force-dynamic";

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const { clients, properties } = await getDealFormOptions();

  return (
    <>
      <PageHeader title="New deal" />
      <Card className="max-w-3xl p-6">
        <DealForm
          clients={clients}
          properties={properties}
          defaultType={type === "rental" ? "rental" : "sale"}
        />
      </Card>
    </>
  );
}
