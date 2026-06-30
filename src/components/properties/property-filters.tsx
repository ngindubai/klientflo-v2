"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

const selectClass =
  "h-10 rounded-lg border border-border bg-surface px-2 text-sm outline-none focus:border-primary";

/** Search + area / bedrooms / status filters for the Properties portfolio. */
export function PropertyFilters({ areas }: { areas: string[] }) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/properties?${next.toString()}`);
  }

  const active = ["q", "area", "bedrooms", "status"].some((k) => params.get(k));

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="flex min-w-56 flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3">
        <Search className="size-4 text-foreground-muted" />
        <input
          defaultValue={params.get("q") ?? ""}
          placeholder="Search title, area, community, listing ID…"
          onKeyDown={(e) => {
            if (e.key === "Enter")
              update("q", (e.target as HTMLInputElement).value);
          }}
          className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-muted"
        />
      </div>
      {areas.length > 0 && (
        <select
          className={selectClass}
          value={params.get("area") ?? ""}
          onChange={(e) => update("area", e.target.value)}
        >
          <option value="">All areas</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      )}
      <select
        className={selectClass}
        value={params.get("bedrooms") ?? ""}
        onChange={(e) => update("bedrooms", e.target.value)}
      >
        <option value="">Any beds</option>
        <option value="0">Studio</option>
        <option value="1">1 bed</option>
        <option value="2">2 bed</option>
        <option value="3">3 bed</option>
        <option value="4">4+ bed</option>
      </select>
      <select
        className={selectClass}
        value={params.get("status") ?? ""}
        onChange={(e) => update("status", e.target.value)}
      >
        <option value="">All status</option>
        <option value="active">Active</option>
        <option value="expired">Expired</option>
        <option value="draft">Draft</option>
      </select>
      {active && (
        <button
          onClick={() => router.push("/properties")}
          className="text-sm font-medium text-primary hover:underline"
        >
          Clear
        </button>
      )}
    </div>
  );
}
