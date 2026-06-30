"use client";

import { useState, useTransition } from "react";
import { FileText, X, AlertTriangle } from "lucide-react";
import { sendPackToConversation } from "@/server/conversation-pack";
import type { BulkSendResult } from "@/server/bulk-send";

const selectClass =
  "w-full rounded-lg border border-border bg-surface px-2 py-2 text-sm outline-none focus:border-primary";

/**
 * Send a branded PDF pack to the current conversation's contact, without
 * leaving the chat. Pick a template + property, optional message, send.
 */
export function SendPackButton({
  conversationId,
  templates,
  properties,
}: {
  conversationId: string;
  templates: { id: string; name: string }[];
  properties: { id: string; title: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [caption, setCaption] = useState("");
  const [result, setResult] = useState<BulkSendResult | null>(null);
  const [pending, start] = useTransition();

  const disabled = templates.length === 0 || properties.length === 0;

  function send() {
    start(async () => {
      const r = await sendPackToConversation({
        conversationId,
        templateId,
        propertyId,
        caption,
      });
      setResult(r);
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          setResult(null);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
        title="Send a PDF pack"
      >
        <FileText className="size-3.5" /> Send pack
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Send a PDF pack</p>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-foreground-muted hover:bg-surface-muted"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          {disabled ? (
            <p className="text-xs text-foreground-muted">
              Add a template (Storage) and a property first to send packs.
            </p>
          ) : result ? (
            <div className="space-y-2 text-sm">
              {result.error ? (
                <p className="text-urgency-5">{result.error}</p>
              ) : (
                <>
                  <p>{result.sent > 0 ? "Pack sent." : "Could not send."}</p>
                  {result.demo && (
                    <p className="rounded-md bg-surface-muted px-2 py-1.5 text-xs text-foreground-muted">
                      Demo mode — sending is simulated.
                    </p>
                  )}
                  {result.recipients.some((r) => r.needsTemplate) && (
                    <p className="flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2 py-1.5 text-xs text-amber-700">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                      Outside the 24-hour window — needs an approved template in
                      production.
                    </p>
                  )}
                </>
              )}
              <button
                onClick={() => setOpen(false)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-foreground-muted">
                  Template
                </span>
                <select
                  className={selectClass}
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                >
                  <option value="">Choose template…</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-foreground-muted">
                  Property
                </span>
                <select
                  className={selectClass}
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                >
                  <option value="">Choose property…</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-foreground-muted">
                  Message (optional)
                </span>
                <input
                  className={selectClass}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Have a look at this one…"
                />
              </label>
              <button
                onClick={send}
                disabled={pending || !templateId || !propertyId}
                className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {pending ? "Generating & sending…" : "Generate & send"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
