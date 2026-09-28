import { notFound } from "next/navigation";
import { DealWorkspace } from "@/components/pipeline/deal-workspace";
import { getDealWorkspace } from "@/server/deal-workspace";

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await getDealWorkspace(id);
  if (!deal) notFound();
  return <DealWorkspace deal={deal} fullPage />;
}
