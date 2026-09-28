"use client";

import { Modal } from "@/components/ui/modal";
import { useState, useTransition } from "react";
import { Package, Loader2, Copy, Check, Paperclip } from "lucide-react";
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
        <Modal title={`Information pack (${pack.kind})`} onClose={() => setPack(null)}>
            <div className="p-4">
              <pre className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] rounded-lg bg-surface-muted p-3 font-sans text-sm">
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
                  Copy into a conversation, or use Sales pack to preview and send a PDF.
                </span>
              </div>
            </div>
        </Modal>
      )}
    </>
  );
}
