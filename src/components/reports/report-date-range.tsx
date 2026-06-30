"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";

/** Custom from/to date range for the reports page. */
export function ReportDateRange({
  from,
  to,
}: {
  from?: string;
  to?: string;
}) {
  const router = useRouter();
  const [f, setF] = useState(from ?? "");
  const [t, setT] = useState(to ?? "");

  function apply() {
    const params = new URLSearchParams();
    if (f) params.set("from", f);
    if (t) params.set("to", t);
    router.push(params.toString() ? `/reports?${params.toString()}` : "/reports");
  }

  const inputClass =
    "h-9 rounded-lg border border-border bg-surface px-2 text-sm outline-none focus:border-primary";

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1">
      <CalendarDays className="size-4 text-foreground-muted" />
      <input
        type="date"
        aria-label="From date"
        value={f}
        max={t || undefined}
        onChange={(e) => setF(e.target.value)}
        className={inputClass}
      />
      <span className="text-xs text-foreground-muted">–</span>
      <input
        type="date"
        aria-label="To date"
        value={t}
        min={f || undefined}
        onChange={(e) => setT(e.target.value)}
        className={inputClass}
      />
      <button
        onClick={apply}
        disabled={!f && !t}
        className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        Apply
      </button>
    </div>
  );
}
