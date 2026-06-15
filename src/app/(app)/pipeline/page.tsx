import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DealCard } from "@/components/pipeline/deal-card";
import { getPipeline, stagesFor } from "@/server/deals";
import { formatAED } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { DealType } from "@/lib/constants";

export const dynamic = "force-dynamic";

const TABS: { type: DealType; label: string }[] = [
  { type: "sale", label: "Sales" },
  { type: "rental", label: "Rental" },
];

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type: typeParam } = await searchParams;
  const type: DealType = typeParam === "rental" ? "rental" : "sale";
  const { columns, count } = await getPipeline(type);
  const stages = stagesFor(type);

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
        <div className="-mx-4 overflow-x-auto px-4 pb-4 lg:-mx-6 lg:px-6">
          <div className="flex gap-3">
            {columns.map((col) => (
              <div key={col.stage} className="flex w-72 shrink-0 flex-col">
                <div className="mb-2 flex items-center justify-between gap-2 px-1">
                  <h2 className="text-sm font-semibold">{col.label}</h2>
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-foreground-muted tabular-nums">
                    {col.deals.length}
                  </span>
                </div>
                {col.total > 0 && (
                  <p className="mb-2 px-1 text-xs text-foreground-muted tabular-nums">
                    {formatAED(col.total)}
                  </p>
                )}
                <div className="flex flex-col gap-2 rounded-[var(--radius-card)] bg-surface-muted/40 p-2">
                  {col.deals.length === 0 ? (
                    <p className="px-1 py-4 text-center text-xs text-foreground-muted">
                      —
                    </p>
                  ) : (
                    col.deals.map((deal) => (
                      <DealCard key={deal.id} deal={deal} stages={stages} />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
