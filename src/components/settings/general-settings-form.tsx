"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import {
  updateGeneralSettings,
  type GeneralSettingsInput,
} from "@/server/settings-actions";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1 block text-xs font-medium text-foreground-muted";

export function GeneralSettingsForm({
  initial,
}: {
  initial: GeneralSettingsInput;
}) {
  const router = useRouter();
  const [form, setForm] = useState<GeneralSettingsInput>(initial);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const set = (k: keyof GeneralSettingsInput) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function save() {
    setSaved(false);
    startTransition(async () => {
      await updateGeneralSettings(form);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">WhatsApp</h3>
        <Field label="Business number">
          <input className={inputClass} value={form.whatsappBusinessNumber} onChange={set("whatsappBusinessNumber")} placeholder="+9715..." />
        </Field>
        <p className="text-xs text-foreground-muted">
          API credentials (access token, phone number id, app secret, verify
          token) are configured via environment variables for security.
        </p>
      </section>

      <section className="space-y-3 border-t border-border pt-6">
        <h3 className="text-sm font-semibold">Calendar</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Working hours start">
            <input type="time" className={inputClass} value={form.workingHoursStart} onChange={set("workingHoursStart")} />
          </Field>
          <Field label="Working hours end">
            <input type="time" className={inputClass} value={form.workingHoursEnd} onChange={set("workingHoursEnd")} />
          </Field>
          <Field label="Viewing duration (min)">
            <input inputMode="numeric" className={inputClass} value={form.viewingDuration} onChange={set("viewingDuration")} />
          </Field>
          <Field label="Meeting duration (min)">
            <input inputMode="numeric" className={inputClass} value={form.meetingDuration} onChange={set("meetingDuration")} />
          </Field>
          <Field label="Buffer time (min)">
            <input inputMode="numeric" className={inputClass} value={form.bufferTime} onChange={set("bufferTime")} />
          </Field>
        </div>
      </section>

      <section className="space-y-3 border-t border-border pt-6">
        <h3 className="text-sm font-semibold">Property sources</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Broker number">
            <input className={inputClass} value={form.brokerNumber} onChange={set("brokerNumber")} placeholder="BRN-..." />
          </Field>
          <Field label="Refresh frequency">
            <input className={inputClass} value={form.refreshFrequency} onChange={set("refreshFrequency")} placeholder="daily" />
          </Field>
        </div>
        <p className="text-xs text-foreground-muted">
          Imports listings from Property Finder & Bayut when a broker number is set.
        </p>
      </section>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={isPending}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save settings"}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-accent">
            <Check className="size-4" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}
