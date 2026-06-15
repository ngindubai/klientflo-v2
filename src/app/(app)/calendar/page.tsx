import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        title="Calendar"
        description="Viewings, meetings, trustee appointments, signings and handovers."
      />
      <ComingSoon chunk="Chunk 9" />
    </>
  );
}
