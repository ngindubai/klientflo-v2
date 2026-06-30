"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, Trash2 } from "lucide-react";
import {
  importOwnersCsv,
  clearOwners,
  type ImportResult,
} from "@/server/owner-actions";

/**
 * Upload a CSV of owners. The file is read in the browser and its text passed
 * to the server action, which auto-maps columns by header name. Recognised
 * headers: Name, Phone, Email, Area, Building, Unit, Notes (+ common aliases).
 */
export function OwnerImport({ total }: { total: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, startTransition] = useTransition();

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      startTransition(async () => {
        const r = await importOwnersCsv(text);
        setResult(r);
        if (inputRef.current) inputRef.current.value = "";
      });
    };
    reader.readAsText(file);
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Import owners</p>
          <p className="text-xs text-foreground-muted">
            CSV with headers Name, Phone, Email, Area, Building, Unit, Notes.
            {total > 0 ? ` ${total} owners stored.` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Upload className="size-4" />
            {pending ? "Importing…" : "Upload CSV"}
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={pending}
              onChange={onFile}
            />
          </label>
          {total > 0 && (
            <button
              onClick={() => {
                if (confirm("Delete all owners? This can't be undone."))
                  startTransition(() => clearOwners().then(() => setResult(null)));
              }}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted disabled:opacity-50"
            >
              <Trash2 className="size-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {result && (
        <div className="mt-3 rounded-lg bg-surface-muted px-3 py-2 text-xs">
          {result.error ? (
            <p className="text-urgency-5">{result.error}</p>
          ) : (
            <p className="text-foreground-muted">
              Imported <strong className="text-foreground">{result.imported}</strong> of{" "}
              {result.total} rows
              {result.skipped > 0 ? ` · ${result.skipped} skipped (no name or duplicate phone)` : ""}
              {result.unmappedHeaders.length > 0
                ? ` · ignored columns: ${result.unmappedHeaders.join(", ")}`
                : ""}
              .
            </p>
          )}
        </div>
      )}
    </div>
  );
}
