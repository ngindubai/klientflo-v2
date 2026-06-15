"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EVENT_TYPES, humanizeEnum } from "@/lib/constants";
import {
  createEvent,
  updateEvent,
  type EventInput,
} from "@/server/event-actions";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1 block text-xs font-medium text-foreground-muted";

type Option = { id: string; name: string };

export function EventForm({
  mode,
  id,
  initial,
  clients,
  properties,
}: {
  mode: "create" | "edit";
  id?: string;
  initial: Partial<EventInput>;
  clients: Option[];
  properties: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<EventInput>({
    type: initial.type ?? "viewing",
    title: initial.title ?? "",
    startsAt: initial.startsAt ?? "",
    endsAt: initial.endsAt ?? "",
    location: initial.location ?? "",
    clientId: initial.clientId ?? "",
    propertyId: initial.propertyId ?? "",
    notes: initial.notes ?? "",
  });

  const set = (key: keyof EventInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (mode === "create") await createEvent(form);
        else await updateEvent(id!, form);
      } catch (err) {
        if (
          err &&
          typeof err === "object" &&
          "digest" in err &&
          String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
        ) {
          throw err;
        }
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Type">
          <select className={inputClass} value={form.type} onChange={set("type")}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{humanizeEnum(t)}</option>
            ))}
          </select>
        </Field>
        <Field label="Title *">
          <input required className={inputClass} value={form.title} onChange={set("title")} />
        </Field>
        <Field label="Starts *">
          <input
            required
            type="datetime-local"
            className={inputClass}
            value={form.startsAt}
            onChange={set("startsAt")}
          />
        </Field>
        <Field label="Ends">
          <input
            type="datetime-local"
            className={inputClass}
            value={form.endsAt}
            onChange={set("endsAt")}
          />
        </Field>
        <Field label="Client">
          <select className={inputClass} value={form.clientId} onChange={set("clientId")}>
            <option value="">—</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Property">
          <select className={inputClass} value={form.propertyId} onChange={set("propertyId")}>
            <option value="">—</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </Field>
        <Field label="Location" full>
          <input className={inputClass} value={form.location} onChange={set("location")} />
        </Field>
        <Field label="Notes" full>
          <textarea className={inputClass} rows={2} value={form.notes} onChange={set("notes")} />
        </Field>
      </div>

      {error && (
        <p className="rounded-lg bg-urgency-5/10 px-3 py-2 text-sm text-urgency-5">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Saving…" : mode === "create" ? "Create event" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-surface-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}
