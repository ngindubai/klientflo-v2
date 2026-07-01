"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { MessageCircle, Phone, Send, Pencil, Check } from "lucide-react";
import {
  updateContactNote,
  sendContactMessages,
  draftContactMessage,
} from "@/server/contact-actions";
import { RecipientMessageDialog } from "@/components/messaging/recipient-message-dialog";
import type { MessageTemplate } from "@/server/settings";
import { formatAED } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type ContactRow = {
  id: string;
  name: string;
  phone: string;
  area: string | null;
  budgetMax: number | null;
  agencyName: string | null;
  notes: string | null;
};

export function ContactsTable({
  contacts,
  templates,
  category,
}: {
  contacts: ContactRow[];
  templates: MessageTemplate[];
  category: "agent" | "investor";
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [compose, setCompose] = useState<string[] | null>(null);
  const isAgent = category === "agent";
  const allSelected = contacts.length > 0 && contacts.every((c) => selected.has(c.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary-muted px-3 py-2">
          <span className="text-sm font-medium text-primary">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs font-medium text-foreground-muted hover:underline"
            >
              Clear
            </button>
            <button
              onClick={() => setCompose([...selected])}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Send className="size-3.5" /> Message {isAgent ? "agents" : "investors"}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-muted">
              <th className="w-8 px-2 py-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() =>
                    setSelected(allSelected ? new Set() : new Set(contacts.map((c) => c.id)))
                  }
                  aria-label="Select all"
                />
              </th>
              <th className="px-2 py-2 font-medium">Name</th>
              <th className="px-2 py-2 font-medium">{isAgent ? "Agency" : "Looking in"}</th>
              <th className="px-2 py-2 font-medium">{isAgent ? "Area" : "Ticket"}</th>
              <th className="px-2 py-2 font-medium">Notes</th>
              <th className="px-2 py-2 text-right font-medium">Contact</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr
                key={c.id}
                className={cn(
                  "border-b border-border/60 last:border-0 hover:bg-surface-muted/50",
                  selected.has(c.id) && "bg-primary-muted/40",
                )}
              >
                <td className="px-2 py-2 align-top">
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggle(c.id)}
                    aria-label={`Select ${c.name}`}
                  />
                </td>
                <td className="px-2 py-2 align-top">
                  <Link href={`/clients/${c.id}`} className="font-medium hover:text-primary">
                    {c.name}
                  </Link>
                  <div className="text-xs text-foreground-muted">{c.phone}</div>
                </td>
                <td className="px-2 py-2 align-top text-foreground-muted">
                  {isAgent ? c.agencyName ?? "—" : c.area ?? "—"}
                </td>
                <td className="px-2 py-2 align-top text-foreground-muted">
                  {isAgent
                    ? c.area ?? "—"
                    : c.budgetMax != null
                      ? formatAED(c.budgetMax)
                      : "—"}
                </td>
                <td className="px-2 py-2 align-top">
                  <NotesCell id={c.id} notes={c.notes} />
                </td>
                <td className="px-2 py-2 align-top">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setCompose([c.id])}
                      title="Send WhatsApp message"
                      className="rounded-md border border-border p-1.5 text-emerald-600 hover:bg-surface-muted"
                    >
                      <MessageCircle className="size-4" />
                    </button>
                    <a
                      href={`tel:${c.phone}`}
                      title="Call"
                      className="rounded-md border border-border p-1.5 text-foreground-muted hover:bg-surface-muted"
                    >
                      <Phone className="size-4" />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {compose && (
        <RecipientMessageDialog
          recipientIds={compose}
          count={compose.length}
          templates={templates}
          noun={isAgent ? "agent" : "investor"}
          send={sendContactMessages}
          draft={draftContactMessage}
          onClose={() => {
            setCompose(null);
            setSelected(new Set());
          }}
        />
      )}
    </>
  );
}

function NotesCell({ id, notes }: { id: string; notes: string | null }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(notes ?? "");
  const [pending, start] = useTransition();

  function save() {
    start(() => updateContactNote(id, value).then(() => setEditing(false)));
  }

  if (editing) {
    return (
      <div className="flex items-start gap-1">
        <textarea
          rows={2}
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-44 rounded-md border border-border bg-surface px-2 py-1 text-xs outline-none focus:border-primary"
          placeholder="Add a note…"
        />
        <button
          onClick={save}
          disabled={pending}
          className="rounded-md p-1 text-primary hover:bg-surface-muted"
          title="Save note"
        >
          <Check className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group inline-flex max-w-44 items-start gap-1 text-left text-xs text-foreground-muted hover:text-foreground"
      title="Edit note"
    >
      <span className="line-clamp-2">{notes || "Add a note…"}</span>
      <Pencil className="mt-0.5 size-3 shrink-0 opacity-0 group-hover:opacity-100" />
    </button>
  );
}
