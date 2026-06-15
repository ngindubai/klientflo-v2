import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { PropertyForm } from "@/components/properties/property-form";

export default function NewPropertyPage() {
  return (
    <>
      <PageHeader
        title="Add property"
        description="Manually add a listing. Portal imports populate this automatically."
      />
      <Card className="max-w-3xl p-6">
        <PropertyForm mode="create" />
      </Card>
    </>
  );
}
