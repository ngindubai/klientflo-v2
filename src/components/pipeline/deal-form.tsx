"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DEAL_TYPES, humanizeEnum } from "@/lib/constants";
import { createDeal, type DealInput } from "@/server/deal-actions";
import {
  SALES_PIPELINE_STAGES,
  RENTAL_PIPELINE_STAGES,
} from "@/lib/constants";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1 block text-xs font-medium text-foreground-muted";

export function DealForm({
  clients,
  properties,
  defaultType,
}: {
  clients: { id: string; name: string }[];
  properties: { id: string; title: string }[];
  defaultType: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<DealInput>({
    clientId: "",
    type: defaultType,
    propertyId: "",
    amount: "",
    stage: "new_enquiry",
    notes: "",
  });

  const stages =
    form.type === "rental" ? RENTAL_PIPELINE_STAGES : SALES_PIPELINE_STAGES;

  const set = (key: keyof DealInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createDeal(form);
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
        <Field label="Pipeline">
          <select className={inputClass} value={form.type} onChange={set("type")}>
            {DEAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === "sale" ? "Sales" : "Rental"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Stage">
          <select className={inputClass} value={form.stage} onChange={set("stage")}>
            {stages.map((s) => (
              <option key={s} value={s}>{humanizeEnum(s)}</option>
            ))}
          </select>
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
        <Field label="Amount (AED)">
          <input className={inputClass} value={form.amount} onChange={set("amount")} inputMode="numeric" />
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
          {isPending ? "Creating…" : "Create deal"}
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
