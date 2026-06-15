"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CONVERSATION_CLASSIFICATIONS, humanizeEnum } from "@/lib/constants";

const selectClass =
  "rounded-lg border border-border bg-surface px-2 py-1.5 text-xs outline-none focus:border-primary";

export function InboxFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const priority = params.get("priority") ?? "";
  const category = params.get("category") ?? "";

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/inbox?${next.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 border-b border-border p-2">
      <select
        className={selectClass}
        value={priority}
        onChange={(e) => update("priority", e.target.value)}
      >
        <option value="">All priorities</option>
        <option value="5">Immediate (5)</option>
        <option value="4">Urgent (4+)</option>
        <option value="3">Elevated (3+)</option>
      </select>
      <select
        className={selectClass}
        value={category}
        onChange={(e) => update("category", e.target.value)}
      >
        <option value="">All categories</option>
        {CONVERSATION_CLASSIFICATIONS.map((c) => (
          <option key={c} value={c}>
            {humanizeEnum(c)}
          </option>
        ))}
      </select>
      {(priority || category) && (
        <button
          onClick={() => router.push("/inbox")}
          className="text-xs font-medium text-primary hover:underline"
        >
          Clear
        </button>
      )}
    </div>
  );
}
