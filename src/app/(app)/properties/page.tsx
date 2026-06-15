import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function PropertiesPage() {
  return (
    <>
      <PageHeader
        title="Properties"
        description="Your portfolio with AI matching and one-click information packs."
      />
      <ComingSoon chunk="Chunk 8" />
    </>
  );
}
