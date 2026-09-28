import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { getPipeline, stagesFor } from "@/server/deals";
import { cn } from "@/lib/utils";
import type { DealType } from "@/lib/constants";
import { DealDrawer } from "@/components/pipeline/deal-workspace";
import { getDealWorkspace } from "@/server/deal-workspace";

export const dynamic = "force-dynamic";

const TABS: { type: DealType; label: string }[] = [
  { type: "sale", label: "Sales" },
  { type: "rental", label: "Rental" },
];

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; deal?: string }>;
}) {
  const { type: typeParam, deal: selectedId } = await searchParams;
  const type: DealType = typeParam === "rental" ? "rental" : "sale";
  const { columns, count } = await getPipeline(type);
  const stages = stagesFor(type);
  const selected = selectedId ? await getDealWorkspace(selectedId) : null;

  return (
    <>
      <PageHeader
        title="Pipeline"
        description="Move deals through the Dubai sales and rental pipelines."
        action={
          <Link
            href={`/pipeline/new?type=${type}`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" /> New deal
          </Link>
        }
      />

      <div className="mb-4 flex items-center gap-1 rounded-lg border border-border p-0.5 w-fit">
        {TABS.map((t) => (
          <Link
            key={t.type}
            href={`/pipeline?type=${t.type}`}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium",
              t.type === type
                ? "bg-primary text-primary-foreground"
                : "text-foreground-muted hover:bg-surface-muted",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {count === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface/50 p-10 text-center text-sm text-foreground-muted">
          No {type === "sale" ? "sales" : "rental"} deals yet. Use “New deal” to
          start one.
        </div>
      ) : (
        <PipelineBoard
          columns={columns.map((c) => ({
            stage: c.stage,
            label: c.label,
            deals: c.deals.map((d) => ({
              id: d.id,
              stage: d.stage,
              amount: d.amount,
              type: d.type,
              taskSummary: d.taskSummary,
              client: d.client ? { id: d.client.id, name: d.client.name } : null,
              property: d.property
                ? { id: d.property.id, title: d.property.title }
                : null,
            })),
          }))}
          stages={stages}
        />
      )}
      {selectedId && <DealDrawer deal={selected} returnHref={`/pipeline?type=${type}`} />}
    </>
  );
}
