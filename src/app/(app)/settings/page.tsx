import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="WhatsApp, AI behaviour, calendar and property-source configuration."
      />
      <ComingSoon chunk="Chunk 15" />
    </>
  );
}
