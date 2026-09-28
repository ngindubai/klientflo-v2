"use client";

import Link from "next/link";
import { GripVertical } from "lucide-react";
import { formatAED } from "@/lib/utils";
import { humanizeEnum } from "@/lib/constants";
import type { taskSummary } from "@/lib/deal-workflow";

export type BoardDeal = {
  id: string;
  type: string;
  stage: string;
  amount: number | null;
  taskSummary: ReturnType<typeof taskSummary>;
  client: { id: string; name: string } | null;
  property: { id: string; title: string } | null;
};

export function DealCard({
  deal,
  stages,
  onMove,
  onDragStart,
  dragging,
  pending,
}: {
  deal: BoardDeal;
  stages: readonly string[];
  onMove: (dealId: string, stage: string) => void;
  onDragStart: (dealId: string) => void;
  dragging: boolean;
  pending: boolean;
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
            <Link href={`/pipeline?type=${deal.type}&deal=${deal.id}`} scroll={false} className="text-sm font-medium hover:underline">
              {deal.client.name}
            </Link>
          ) : (
            <Link href={`/pipeline?type=${deal.type}&deal=${deal.id}`} scroll={false} className="text-sm font-medium text-foreground-muted hover:underline">Unassigned deal</Link>
          )}
          {deal.property && (
            <Link
              href={`/pipeline?type=${deal.type}&deal=${deal.id}`}
              scroll={false}
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
      <Link href={`/pipeline?type=${deal.type}&deal=${deal.id}`} scroll={false} className="mt-2 block rounded-lg border border-border p-2 text-xs hover:bg-primary-muted">
        <p className="line-clamp-2 text-foreground-muted">{deal.taskSummary.next ? `Next: ${deal.taskSummary.next.title}` : "View deal details and tasks"}</p>
        <p className="mt-1 flex flex-wrap gap-2"><span>{deal.taskSummary.open} outstanding</span>{deal.taskSummary.overdue > 0 && <span className="text-urgency-5">{deal.taskSummary.overdue} overdue</span>}{deal.taskSummary.blocked > 0 && <span className="text-urgency-5">{deal.taskSummary.blocked} blocked</span>}</p>
      </Link>

      <select
        value={deal.stage}
        disabled={pending}
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
