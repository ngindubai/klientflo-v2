import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { PropertyForm } from "@/components/properties/property-form";
import { getProperty } from "@/server/properties";
import type { PropertyInput } from "@/server/property-actions";

export const dynamic = "force-dynamic";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();

  const initial: Partial<PropertyInput> = {
    title: property.title,
    price: property.price.toString(),
    bedrooms: property.bedrooms?.toString() ?? "",
    bathrooms: property.bathrooms?.toString() ?? "",
    sizeSqft: property.sizeSqft?.toString() ?? "",
    propertyType: property.propertyType ?? "",
    area: property.area ?? "",
    community: property.community ?? "",
    listingUrl: property.listingUrl ?? "",
    permitNumber: property.permitNumber ?? "",
    description: property.description ?? "",
    paymentPlan: property.paymentPlan ?? "",
  };

  return (
    <>
      <PageHeader title={`Edit ${property.title}`} />
      <Card className="max-w-3xl p-6">
        <PropertyForm mode="edit" id={property.id} initial={initial} />
      </Card>
    </>
  );
}
