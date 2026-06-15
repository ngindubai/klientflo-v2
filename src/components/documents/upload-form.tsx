"use client";

import { useState } from "react";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_TYPES_BY_CATEGORY,
  humanizeEnum,
  type DocumentCategory,
} from "@/lib/constants";
import { uploadDocument } from "@/server/document-actions";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1 block text-xs font-medium text-foreground-muted";

export function UploadForm({
  clients,
  properties,
  deals,
}: {
  clients: { id: string; name: string }[];
  properties: { id: string; title: string }[];
  deals: { id: string; type: string; client: { name: string } | null }[];
}) {
  const [category, setCategory] = useState<DocumentCategory>("client");
  const types = DOCUMENT_TYPES_BY_CATEGORY[category];

  return (
    <form action={uploadDocument} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Category">
          <select
            name="category"
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value as DocumentCategory)}
          >
            {DOCUMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{humanizeEnum(c)}</option>
            ))}
          </select>
        </Field>
        <Field label="Type">
          <select name="type" className={inputClass} defaultValue={types[0]} key={category}>
            {types.map((t) => (
              <option key={t} value={t}>{humanizeEnum(t)}</option>
            ))}
          </select>
        </Field>

        <Field label="File *" full>
          <input
            required
            type="file"
            name="file"
            className="block w-full text-sm text-foreground-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
          />
        </Field>

        <Field label="Display name (optional)">
          <input name="name" className={inputClass} placeholder="Defaults to file name" />
        </Field>
        <Field label="Expiry (optional)">
          <input type="date" name="expiresAt" className={inputClass} />
        </Field>

        <Field label="Link to client">
          <select name="clientId" className={inputClass} defaultValue="">
            <option value="">—</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Link to property">
          <select name="propertyId" className={inputClass} defaultValue="">
            <option value="">—</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </Field>
        <Field label="Link to deal" full>
          <select name="dealId" className={inputClass} defaultValue="">
            <option value="">—</option>
            {deals.map((d) => (
              <option key={d.id} value={d.id}>
                {(d.client?.name ?? "Unassigned") + " · " + (d.type === "sale" ? "Sale" : "Rental")}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Upload
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
