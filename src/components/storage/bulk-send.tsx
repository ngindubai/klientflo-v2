"use client";

import { useMemo, useState, useTransition } from "react";
import { Send, ArrowLeft, AlertTriangle } from "lucide-react";
import { sendBulkPdf, type BulkSendResult } from "@/server/bulk-send";
import {
  CONTACT_CATEGORY_LABELS,
  type ContactCategory,
} from "@/lib/constants";

type PropertyOption = { id: string; title: string };
type Contact = {
  id: string;
  name: string;
  phone: string;
  category: ContactCategory;
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";

export function BulkSend({
  templateId,
  templateName,
  properties,
  contacts,
  onClose,
}: {
  templateId: string;
  templateName: string;
  properties: PropertyOption[];
  contacts: Contact[];
  onClose: () => void;
}) {
  const [propertyId, setPropertyId] = useState("");
  const [caption, setCaption] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<BulkSendResult | null>(null);
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? contacts.filter(
          (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q),
        )
      : contacts;
  }, [contacts, search]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function selectAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      filtered.forEach((c) => next.add(c.id));
      return next;
    });
  }

  function send() {
    start(async () => {
      const r = await sendBulkPdf({
        templateId,
        propertyId,
        contactIds: [...selected],
        caption,
      });
      setResult(r);
    });
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={onClose}
          className="rounded-md p-1 text-foreground-muted hover:bg-surface-muted"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </button>
        <h2 className="text-sm font-semibold">
          Send “{templateName}” to clients
        </h2>
      </div>

      {result ? (
        <SendReport result={result} onBack={() => setResult(null)} />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground-muted">
                Property for the PDF
              </label>
              <select
                className={inputClass}
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
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground-muted">
                Message (optional)
              </label>
              <input
                className={inputClass}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Have a look at this one…"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <label className="text-xs font-medium text-foreground-muted">
                Recipients ({selected.size} selected)
              </label>
              <button
                onClick={selectAllVisible}
                className="text-xs font-medium text-primary hover:underline"
              >
                Select all shown
              </button>
            </div>
            <input
              className={inputClass + " mb-2"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts…"
            />
            <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
              {filtered.length === 0 ? (
                <p className="p-4 text-center text-sm text-foreground-muted">
                  No contacts. Tag WhatsApp conversations to build your list.
                </p>
              ) : (
                filtered.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-3 border-b border-border/60 px-3 py-2 text-sm last:border-0 hover:bg-surface-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggle(c.id)}
                    />
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-foreground-muted">
                      {CONTACT_CATEGORY_LABELS[c.category]}
                    </span>
                    <span className="hidden text-xs text-foreground-muted sm:inline">
                      {c.phone}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <button
            onClick={send}
            disabled={pending || selected.size === 0 || !propertyId}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Send className="size-4" />
            {pending
              ? "Sending…"
              : `Generate PDF & send to ${selected.size || ""} ${
                  selected.size === 1 ? "client" : "clients"
                }`}
          </button>
        </div>
      )}
    </div>
  );
}

function SendReport({
  result,
  onBack,
}: {
  result: BulkSendResult;
  onBack: () => void;
}) {
  if (result.error) {
    return (
      <div>
        <p className="rounded-lg bg-urgency-5/10 px-3 py-2 text-sm text-urgency-5">
          {result.error}
        </p>
        <button
          onClick={onBack}
          className="mt-3 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
        >
          Back
        </button>
      </div>
    );
  }
  const needTemplate = result.recipients.filter((r) => r.needsTemplate).length;
  return (
    <div className="space-y-3">
      <p className="text-sm">
        Sent <strong>{result.sent}</strong>
        {result.failed > 0 ? `, ${result.failed} failed` : ""}. PDF generated and
        attached.
      </p>
      {result.demo && (
        <p className="rounded-lg bg-surface-muted px-3 py-2 text-xs text-foreground-muted">
          Demo mode — messages are simulated (no WhatsApp credentials set).
        </p>
      )}
      {needTemplate > 0 && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          {needTemplate} recipient{needTemplate === 1 ? " is" : "s are"} outside
          the 24-hour window. In production these require an approved WhatsApp
          template message.
        </p>
      )}
      <ul className="max-h-56 overflow-y-auto rounded-lg border border-border text-sm">
        {result.recipients.map((r, i) => (
          <li
            key={i}
            className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-1.5 last:border-0"
          >
            <span className="truncate">{r.name}</span>
            <span
              className={
                r.status === "sent" ? "text-emerald-600" : "text-urgency-5"
              }
            >
              {r.status}
              {r.needsTemplate ? " · needs template" : ""}
            </span>
          </li>
        ))}
      </ul>
      <button
        onClick={onBack}
        className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
      >
        Send another
      </button>
    </div>
  );
}
