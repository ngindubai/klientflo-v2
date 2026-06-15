import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function InboxPage() {
  return (
    <>
      <PageHeader
        title="WhatsApp Inbox"
        description="Two-way messaging, voice notes, and AI conversation analysis."
      />
      <ComingSoon chunk="Chunk 12" />
    </>
  );
}
