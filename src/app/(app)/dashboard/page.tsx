import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your operational hub — urgent messages, hot leads, today's viewings and more."
      />
      <ComingSoon chunk="Chunk 4" />
    </>
  );
}
