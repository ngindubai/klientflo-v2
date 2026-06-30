"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CLIENT_TYPES,
  PAYMENT_METHODS,
  humanizeEnum,
} from "@/lib/constants";
import {
  createClient,
  updateClient,
  type ClientInput,
} from "@/server/client-actions";

type Props = {
  mode: "create" | "edit";
  id?: string;
  initial?: Partial<ClientInput>;
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1 block text-xs font-medium text-foreground-muted";

export function ClientForm({ mode, id, initial }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<ClientInput>({
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    nationality: initial?.nationality ?? "",
    agencyName: initial?.agencyName ?? "",
    clientType: initial?.clientType ?? "",
    budgetMin: initial?.budgetMin ?? "",
    budgetMax: initial?.budgetMax ?? "",
    area: initial?.area ?? "",
    bedrooms: initial?.bedrooms ?? "",
    propertyType: initial?.propertyType ?? "",
    paymentMethod: initial?.paymentMethod ?? "",
    timeline: initial?.timeline ?? "",
    status: initial?.status ?? "",
    notes: initial?.notes ?? "",
    nextAction: initial?.nextAction ?? "",
  });

  const set = (key: keyof ClientInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (mode === "create") await createClient(form);
        else await updateClient(id!, form);
      } catch (err) {
        // redirect() throws a special error we must rethrow.
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Contact">
        <Field label="Name *">
          <input required className={inputClass} value={form.name} onChange={set("name")} />
        </Field>
        <Field label="Phone *">
          <input required className={inputClass} value={form.phone} onChange={set("phone")} placeholder="+9715..." />
        </Field>
        <Field label="Email">
          <input type="email" className={inputClass} value={form.email} onChange={set("email")} />
        </Field>
        <Field label="Nationality">
          <input className={inputClass} value={form.nationality} onChange={set("nationality")} />
        </Field>
        <Field label="Agency (for agents)">
          <input className={inputClass} value={form.agencyName} onChange={set("agencyName")} placeholder="Agency name" />
        </Field>
      </Section>

      <Section title="Requirements">
        <Field label="Type">
          <select className={inputClass} value={form.clientType} onChange={set("clientType")}>
            <option value="">—</option>
            {CLIENT_TYPES.map((t) => (
              <option key={t} value={t}>{humanizeEnum(t)}</option>
            ))}
          </select>
        </Field>
        <Field label="Area">
          <input className={inputClass} value={form.area} onChange={set("area")} placeholder="Dubai Marina" />
        </Field>
        <Field label="Budget min (AED)">
          <input className={inputClass} value={form.budgetMin} onChange={set("budgetMin")} inputMode="numeric" />
        </Field>
        <Field label="Budget max (AED)">
          <input className={inputClass} value={form.budgetMax} onChange={set("budgetMax")} inputMode="numeric" />
        </Field>
        <Field label="Bedrooms">
          <input className={inputClass} value={form.bedrooms} onChange={set("bedrooms")} inputMode="numeric" />
        </Field>
        <Field label="Property type">
          <input className={inputClass} value={form.propertyType} onChange={set("propertyType")} placeholder="Apartment" />
        </Field>
        <Field label="Payment">
          <select className={inputClass} value={form.paymentMethod} onChange={set("paymentMethod")}>
            <option value="">—</option>
            {PAYMENT_METHODS.map((p) => (
              <option key={p} value={p}>{humanizeEnum(p)}</option>
            ))}
          </select>
        </Field>
        <Field label="Timeline">
          <input className={inputClass} value={form.timeline} onChange={set("timeline")} placeholder="This month" />
        </Field>
      </Section>

      <Section title="Lead">
        <Field label="Status">
          <input className={inputClass} value={form.status} onChange={set("status")} placeholder="Hot lead" />
        </Field>
        <Field label="Next action">
          <input className={inputClass} value={form.nextAction} onChange={set("nextAction")} />
        </Field>
        <Field label="Notes" full>
          <textarea className={inputClass} rows={3} value={form.notes} onChange={set("notes")} />
        </Field>
      </Section>

      {error && (
        <p className="rounded-lg bg-urgency-5/10 px-3 py-2 text-sm text-urgency-5">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Saving…" : mode === "create" ? "Create client" : "Save changes"}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-foreground-muted">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
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
