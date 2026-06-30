"use client";

import { useRouter, useSearchParams } from "next/navigation";

const selectClass =
  "rounded-lg border border-border bg-surface px-2 py-2 text-sm outline-none focus:border-primary";

export function OwnerFilters({
  areas,
  buildings,
}: {
  areas: string[];
  buildings: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/owners?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        defaultValue={params.get("q") ?? ""}
        placeholder="Search name, phone, unit…"
        onKeyDown={(e) => {
          if (e.key === "Enter") update("q", (e.target as HTMLInputElement).value);
        }}
        className="h-10 min-w-48 flex-1 rounded-lg border border-border bg-surface px-3 text-sm outline-none placeholder:text-foreground-muted focus:border-primary"
      />
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
      <select
        className={selectClass}
        value={params.get("building") ?? ""}
        onChange={(e) => update("building", e.target.value)}
      >
        <option value="">All buildings</option>
        {buildings.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>
      {(params.get("q") || params.get("area") || params.get("building")) && (
        <button
          onClick={() => router.push("/owners")}
          className="text-sm font-medium text-primary hover:underline"
        >
          Clear
        </button>
      )}
    </div>
  );
}
