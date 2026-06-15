import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function ClientsPage() {
  return (
    <>
      <PageHeader
        title="Clients"
        description="Lightweight lead and client records, auto-populated from conversations."
      />
      <ComingSoon chunk="Chunk 7" />
    </>
  );
}
