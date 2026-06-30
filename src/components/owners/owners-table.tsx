"use client";

import { useState, useTransition } from "react";
import { MessageCircle, Phone, Send, Pencil, Check } from "lucide-react";
import { updateOwnerNote } from "@/server/owner-actions";
import { OwnerMessageDialog } from "@/components/owners/owner-message-dialog";
import type { MessageTemplate } from "@/server/settings";
import { cn } from "@/lib/utils";

export type OwnerRow = {
  id: string;
  name: string;
  phone: string | null;
  building: string | null;
  unit: string | null;
  area: string | null;
  notes: string | null;
};

export function OwnersTable({
  owners,
  templates,
}: {
  owners: OwnerRow[];
  templates: MessageTemplate[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [compose, setCompose] = useState<string[] | null>(null);

  const withPhone = owners.filter((o) => o.phone);
  const allSelected =
    withPhone.length > 0 && withPhone.every((o) => selected.has(o.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(withPhone.map((o) => o.id)));
  }

  return (
    <>
      {/* Selection action bar */}
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
              <Send className="size-3.5" /> Message owners
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
                  onChange={toggleAll}
                  aria-label="Select all"
                  disabled={withPhone.length === 0}
                />
              </th>
              <th className="px-2 py-2 font-medium">Name</th>
              <th className="px-2 py-2 font-medium">Building</th>
              <th className="px-2 py-2 font-medium">Unit</th>
              <th className="px-2 py-2 font-medium">Area</th>
              <th className="px-2 py-2 font-medium">Notes</th>
              <th className="px-2 py-2 text-right font-medium">Contact</th>
            </tr>
          </thead>
          <tbody>
            {owners.map((o) => (
              <tr
                key={o.id}
                className={cn(
                  "border-b border-border/60 last:border-0 hover:bg-surface-muted/50",
                  selected.has(o.id) && "bg-primary-muted/40",
                )}
              >
                <td className="px-2 py-2 align-top">
                  <input
                    type="checkbox"
                    checked={selected.has(o.id)}
                    onChange={() => toggle(o.id)}
                    disabled={!o.phone}
                    aria-label={`Select ${o.name}`}
                  />
                </td>
                <td className="px-2 py-2 align-top">
                  <div className="font-medium">{o.name}</div>
                  <div className="text-xs text-foreground-muted">{o.phone ?? "—"}</div>
                </td>
                <td className="px-2 py-2 align-top text-foreground-muted">
                  {o.building ?? "—"}
                </td>
                <td className="px-2 py-2 align-top text-foreground-muted">
                  {o.unit ?? "—"}
                </td>
                <td className="px-2 py-2 align-top text-foreground-muted">
                  {o.area ?? "—"}
                </td>
                <td className="px-2 py-2 align-top">
                  <NotesCell id={o.id} notes={o.notes} />
                </td>
                <td className="px-2 py-2 align-top">
                  <div className="flex items-center justify-end gap-1.5">
                    {o.phone && (
                      <>
                        <button
                          onClick={() => setCompose([o.id])}
                          title="Send WhatsApp message"
                          className="rounded-md border border-border p-1.5 text-emerald-600 hover:bg-surface-muted"
                        >
                          <MessageCircle className="size-4" />
                        </button>
                        <a
                          href={`tel:${o.phone}`}
                          title="Call"
                          className="rounded-md border border-border p-1.5 text-foreground-muted hover:bg-surface-muted"
                        >
                          <Phone className="size-4" />
                        </a>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {compose && (
        <OwnerMessageDialog
          ownerIds={compose}
          count={compose.length}
          templates={templates}
          onClose={() => {
            setCompose(null);
            setSelected(new Set());
          }}
        />
      )}
    </>
  );
}

/** Inline-editable note cell. */
function NotesCell({ id, notes }: { id: string; notes: string | null }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(notes ?? "");
  const [pending, start] = useTransition();

  function save() {
    start(() => updateOwnerNote(id, value).then(() => setEditing(false)));
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
