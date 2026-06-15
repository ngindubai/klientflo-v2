"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setDealStage } from "@/server/deal-actions";
import { formatAED } from "@/lib/utils";
import { humanizeEnum } from "@/lib/constants";

type Deal = {
  id: string;
  stage: string;
  amount: number | null;
  client: { id: string; name: string } | null;
  property: { id: string; title: string } | null;
};

export function DealCard({
  deal,
  stages,
}: {
  deal: Deal;
  stages: readonly string[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border border-border bg-surface p-3 shadow-sm">
      {deal.client ? (
        <Link
          href={`/clients/${deal.client.id}`}
          className="text-sm font-medium hover:underline"
        >
          {deal.client.name}
        </Link>
      ) : (
        <span className="text-sm font-medium text-foreground-muted">
          Unassigned
        </span>
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
        <p className="mt-1 text-sm font-semibold tabular-nums">
          {formatAED(deal.amount)}
        </p>
      )}

      <div className="mt-2 flex items-center gap-1.5">
        <select
          value={deal.stage}
          disabled={isPending}
          onChange={(e) => {
            const stage = e.target.value;
            startTransition(async () => {
              await setDealStage(deal.id, stage);
              router.refresh();
            });
          }}
          className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary"
          aria-label="Move deal to stage"
        >
          {stages.map((s) => (
            <option key={s} value={s}>
              {humanizeEnum(s)}
            </option>
          ))}
        </select>
        {isPending && <Loader2 className="size-3.5 animate-spin text-primary" />}
      </div>
    </div>
  );
}
