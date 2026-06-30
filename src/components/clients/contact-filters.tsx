"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

/** Search + area filter for the Clients / Agents / Investors sections. */
export function ContactFilters({
  basePath,
  areas,
  placeholder,
}: {
  basePath: string;
  areas: string[];
  placeholder: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.push(`${basePath}?${next.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="flex min-w-56 flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3">
        <Search className="size-4 text-foreground-muted" />
        <input
          defaultValue={params.get("q") ?? ""}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter")
              update("q", (e.target as HTMLInputElement).value);
          }}
          className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-muted"
        />
      </div>
      {areas.length > 0 && (
        <select
          value={params.get("area") ?? ""}
          onChange={(e) => update("area", e.target.value)}
          className="h-10 rounded-lg border border-border bg-surface px-2 text-sm outline-none focus:border-primary"
        >
          <option value="">All areas</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      )}
      {(params.get("q") || params.get("area")) && (
        <button
          onClick={() => router.push(basePath)}
          className="text-sm font-medium text-primary hover:underline"
        >
          Clear
        </button>
      )}
    </div>
  );
}
