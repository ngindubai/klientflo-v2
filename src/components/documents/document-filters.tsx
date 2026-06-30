"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { DOCUMENT_CATEGORIES, humanizeEnum } from "@/lib/constants";

const selectClass =
  "h-10 rounded-lg border border-border bg-surface px-2 text-sm outline-none focus:border-primary";

/** Search + category + expiry filter for the Documents page. */
export function DocumentFilters() {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/documents?${next.toString()}`);
  }

  const active = ["q", "category", "expiry"].some((k) => params.get(k));

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="flex min-w-56 flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3">
        <Search className="size-4 text-foreground-muted" />
        <input
          defaultValue={params.get("q") ?? ""}
          placeholder="Search document name or type…"
          onKeyDown={(e) => {
            if (e.key === "Enter")
              update("q", (e.target as HTMLInputElement).value);
          }}
          className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-muted"
        />
      </div>
      <select
        className={selectClass}
        value={params.get("category") ?? ""}
        onChange={(e) => update("category", e.target.value)}
      >
        <option value="">All categories</option>
        {DOCUMENT_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {humanizeEnum(c)}
          </option>
        ))}
      </select>
      <select
        className={selectClass}
        value={params.get("expiry") ?? ""}
        onChange={(e) => update("expiry", e.target.value)}
      >
        <option value="">Any expiry</option>
        <option value="soon">Expiring soon</option>
        <option value="expired">Expired</option>
      </select>
      {active && (
        <button
          onClick={() => router.push("/documents")}
          className="text-sm font-medium text-primary hover:underline"
        >
          Clear
        </button>
      )}
    </div>
  );
}
