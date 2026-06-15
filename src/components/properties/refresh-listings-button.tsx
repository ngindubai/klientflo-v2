"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { refreshListingsAction } from "@/server/property-actions";

export function RefreshListingsButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() =>
          startTransition(async () => {
            const r = await refreshListingsAction();
            setMsg(
              r.configured
                ? `Imported ${r.imported}, updated ${r.updated}, expired ${r.expired}.`
                : `Checked for expiries (${r.expired} marked). Add a broker number in Settings to import from portals.`,
            );
            router.refresh();
          })
        }
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted disabled:opacity-60"
      >
        <RefreshCw className={isPending ? "size-4 animate-spin" : "size-4"} />
        {isPending ? "Refreshing…" : "Refresh listings"}
      </button>
      {msg && <span className="text-xs text-foreground-muted">{msg}</span>}
    </div>
  );
}
