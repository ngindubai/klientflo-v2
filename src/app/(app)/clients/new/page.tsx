import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { ClientForm } from "@/components/clients/client-form";

export default function NewClientPage() {
  return (
    <>
      <PageHeader title="New client" description="Add a lead or client record." />
      <Card className="max-w-3xl p-6">
        <ClientForm mode="create" />
      </Card>
    </>
  );
}
