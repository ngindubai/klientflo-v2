"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createProperty,
  updateProperty,
  type PropertyInput,
} from "@/server/property-actions";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1 block text-xs font-medium text-foreground-muted";

export function PropertyForm({
  mode,
  id,
  initial,
}: {
  mode: "create" | "edit";
  id?: string;
  initial?: Partial<PropertyInput>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<PropertyInput>({
    title: initial?.title ?? "",
    price: initial?.price ?? "",
    bedrooms: initial?.bedrooms ?? "",
    bathrooms: initial?.bathrooms ?? "",
    sizeSqft: initial?.sizeSqft ?? "",
    propertyType: initial?.propertyType ?? "",
    area: initial?.area ?? "",
    community: initial?.community ?? "",
    listingUrl: initial?.listingUrl ?? "",
    permitNumber: initial?.permitNumber ?? "",
    description: initial?.description ?? "",
    paymentPlan: initial?.paymentPlan ?? "",
  });

  const set = (key: keyof PropertyInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (mode === "create") await createProperty(form);
        else await updateProperty(id!, form);
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
        <Field label="Title *" full>
          <input required className={inputClass} value={form.title} onChange={set("title")} />
        </Field>
        <Field label="Price (AED) *">
          <input required className={inputClass} value={form.price} onChange={set("price")} inputMode="numeric" />
        </Field>
        <Field label="Property type">
          <input className={inputClass} value={form.propertyType} onChange={set("propertyType")} placeholder="Apartment" />
        </Field>
        <Field label="Bedrooms">
          <input className={inputClass} value={form.bedrooms} onChange={set("bedrooms")} inputMode="numeric" />
        </Field>
        <Field label="Bathrooms">
          <input className={inputClass} value={form.bathrooms} onChange={set("bathrooms")} inputMode="numeric" />
        </Field>
        <Field label="Size (sqft)">
          <input className={inputClass} value={form.sizeSqft} onChange={set("sizeSqft")} inputMode="numeric" />
        </Field>
        <Field label="Area">
          <input className={inputClass} value={form.area} onChange={set("area")} placeholder="Dubai Marina" />
        </Field>
        <Field label="Community">
          <input className={inputClass} value={form.community} onChange={set("community")} />
        </Field>
        <Field label="Listing URL">
          <input className={inputClass} value={form.listingUrl} onChange={set("listingUrl")} />
        </Field>
        <Field label="Permit number">
          <input className={inputClass} value={form.permitNumber} onChange={set("permitNumber")} />
        </Field>
        <Field label="Description" full>
          <textarea className={inputClass} rows={3} value={form.description} onChange={set("description")} />
        </Field>
        <Field label="Payment plan" full>
          <textarea className={inputClass} rows={2} value={form.paymentPlan} onChange={set("paymentPlan")} />
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
          {isPending ? "Saving…" : mode === "create" ? "Add property" : "Save changes"}
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
