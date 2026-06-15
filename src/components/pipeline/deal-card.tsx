"use client";

import Link from "next/link";
import { GripVertical } from "lucide-react";
import { formatAED } from "@/lib/utils";
import { humanizeEnum } from "@/lib/constants";

export type BoardDeal = {
  id: string;
  stage: string;
  amount: number | null;
  client: { id: string; name: string } | null;
  property: { id: string; title: string } | null;
};

export function DealCard({
  deal,
  stages,
  onMove,
  onDragStart,
  dragging,
}: {
  deal: BoardDeal;
  stages: readonly string[];
  onMove: (dealId: string, stage: string) => void;
  onDragStart: (dealId: string) => void;
  dragging: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", deal.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(deal.id);
      }}
      className={`group rounded-lg border border-border bg-surface p-3 shadow-sm ${dragging ? "opacity-40" : ""}`}
    >
      <div className="flex items-start gap-1">
        <GripVertical className="mt-0.5 size-4 shrink-0 cursor-grab text-foreground-muted opacity-0 group-hover:opacity-100" />
        <div className="min-w-0 flex-1">
          {deal.client ? (
            <Link href={`/clients/${deal.client.id}`} className="text-sm font-medium hover:underline">
              {deal.client.name}
            </Link>
          ) : (
            <span className="text-sm font-medium text-foreground-muted">Unassigned</span>
          )}
          {deal.property && (
            <Link
              href={`/properties/${deal.property.id}`}
              className="mt-0.5 block truncate text-xs text-foreground-muted hover:underline"
            >
              {deal.property.title}
            </Link>
          )}
          {deal.amount != null && (
            <p className="mt-1 text-sm font-semibold tabular-nums">{formatAED(deal.amount)}</p>
          )}
        </div>
      </div>

      <select
        value={deal.stage}
        onChange={(e) => onMove(deal.id, e.target.value)}
        className="mt-2 w-full rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary"
        aria-label="Move deal to stage"
      >
        {stages.map((s) => (
          <option key={s} value={s}>
            {humanizeEnum(s)}
          </option>
        ))}
      </select>
    </div>
  );
}
