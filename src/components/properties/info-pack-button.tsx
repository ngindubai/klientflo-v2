"use client";

import { useState, useTransition } from "react";
import { Package, Loader2, Copy, Check, X, Paperclip } from "lucide-react";
import { generateInfoPack } from "@/server/property-actions";
import type { InfoPack } from "@/server/info-pack";

export function InfoPackButton({ propertyId }: { propertyId: string }) {
  const [isPending, startTransition] = useTransition();
  const [pack, setPack] = useState<InfoPack | null>(null);
  const [copied, setCopied] = useState(false);

  return (
    <>
      <button
        onClick={() =>
          startTransition(async () => {
            setPack(await generateInfoPack([propertyId]));
          })
        }
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Package className="size-4" />
        )}
        Generate info pack
      </button>

      {pack && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setPack(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-card)] border border-border bg-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">
                Information pack ({pack.kind === "single" ? "single" : "comparison"})
              </h2>
              <button
                onClick={() => setPack(null)}
                className="rounded p-1 text-foreground-muted hover:bg-surface-muted"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-4">
              <pre className="whitespace-pre-wrap rounded-lg bg-surface-muted p-3 font-sans text-sm">
                {pack.message}
              </pre>

              {pack.items.some((i) => i.attachments.length) && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-medium text-foreground-muted">
                    Attachments
                  </p>
                  <ul className="space-y-1">
                    {pack.items.flatMap((i) =>
                      i.attachments.map((a, idx) => (
                        <li
                          key={`${i.propertyId}-${idx}`}
                          className="flex items-center gap-2 text-sm text-foreground-muted"
                        >
                          <Paperclip className="size-3.5" /> {a.label}
                        </li>
                      )),
                    )}
                  </ul>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(pack.message);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied" : "Copy message"}
                </button>
                <span className="text-xs text-foreground-muted">
                  One-click send via WhatsApp arrives in Chunk 12.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
