import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function DocumentsPage() {
  return (
    <>
      <PageHeader
        title="Documents"
        description="Client, property and transaction documents with expiry reminders."
      />
      <ComingSoon chunk="Chunk 11" />
    </>
  );
}
