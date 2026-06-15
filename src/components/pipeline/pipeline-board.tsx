"use client";

import { useState, useTransition } from "react";
import { DealCard, type BoardDeal } from "@/components/pipeline/deal-card";
import { setDealStage } from "@/server/deal-actions";
import { formatAED } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type BoardColumn = {
  stage: string;
  label: string;
  deals: BoardDeal[];
};

export function PipelineBoard({
  columns,
  stages,
}: {
  columns: BoardColumn[];
  stages: readonly string[];
}) {
  // Flatten to a single source of truth so cards can move between columns.
  const [deals, setDeals] = useState<BoardDeal[]>(() =>
    columns.flatMap((c) => c.deals),
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function move(dealId: string, stage: string) {
    const current = deals.find((d) => d.id === dealId);
    if (!current || current.stage === stage) return;
    const prev = deals;
    setDeals((ds) => ds.map((d) => (d.id === dealId ? { ...d, stage } : d)));
    startTransition(async () => {
      try {
        await setDealStage(dealId, stage);
      } catch {
        setDeals(prev); // revert on failure
      }
    });
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 lg:-mx-6 lg:px-6">
      <div className="flex gap-3">
        {columns.map((col) => {
          const colDeals = deals.filter((d) => d.stage === col.stage);
          const total = colDeals.reduce((s, d) => s + (d.amount ?? 0), 0);
          return (
            <div
              key={col.stage}
              onDragOver={(e) => {
                e.preventDefault();
                setOverStage(col.stage);
              }}
              onDragLeave={() => setOverStage((s) => (s === col.stage ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                if (id) move(id, col.stage);
                setOverStage(null);
                setDragId(null);
              }}
              className="flex w-72 shrink-0 flex-col"
            >
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <h2 className="text-sm font-semibold">{col.label}</h2>
                <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-foreground-muted tabular-nums">
                  {colDeals.length}
                </span>
              </div>
              {total > 0 && (
                <p className="mb-2 px-1 text-xs text-foreground-muted tabular-nums">
                  {formatAED(total)}
                </p>
              )}
              <div
                className={cn(
                  "flex min-h-24 flex-col gap-2 rounded-[var(--radius-card)] p-2 transition-colors",
                  overStage === col.stage
                    ? "bg-primary-muted ring-2 ring-primary/30"
                    : "bg-surface-muted/40",
                )}
              >
                {colDeals.length === 0 ? (
                  <p className="px-1 py-4 text-center text-xs text-foreground-muted">
                    Drop here
                  </p>
                ) : (
                  colDeals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      stages={stages}
                      onMove={move}
                      onDragStart={setDragId}
                      dragging={dragId === deal.id}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
