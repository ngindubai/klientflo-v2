import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { UploadForm } from "@/components/documents/upload-form";
import { getDocumentFormOptions } from "@/server/documents";

export const dynamic = "force-dynamic";

export default async function NewDocumentPage() {
  const { clients, properties, deals } = await getDocumentFormOptions();
  return (
    <>
      <PageHeader title="Upload document" description="Stored securely and linked to a client, deal or property." />
      <Card className="max-w-3xl p-6">
        <UploadForm clients={clients} properties={properties} deals={deals} />
      </Card>
    </>
  );
}
