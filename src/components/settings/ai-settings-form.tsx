"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { updateAiSettings, type AiSettingsInput } from "@/server/settings-actions";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export function AiSettingsForm({ initial }: { initial: AiSettingsInput }) {
  const router = useRouter();
  const [form, setForm] = useState<AiSettingsInput>(initial);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const toggleDay = (d: number) =>
    setForm((f) => ({
      ...f,
      quietHoursDays: f.quietHoursDays.includes(d)
        ? f.quietHoursDays.filter((x) => x !== d)
        : [...f.quietHoursDays, d].sort(),
    }));

  function save() {
    setSaved(false);
    startTransition(async () => {
      await updateAiSettings(form);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="space-y-6">
      {/* Auto-reply */}
      <section className="space-y-3">
        <Toggle
          label="Enable AI auto-replies"
          hint="Let the assistant respond to incoming WhatsApp messages."
          checked={form.aiAutoReplyEnabled}
          onChange={(v) => setForm((f) => ({ ...f, aiAutoReplyEnabled: v }))}
        />
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground-muted">
            Mode
          </label>
          <select
            className={inputClass}
            value={form.aiApprovalMode}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                aiApprovalMode: e.target.value as AiSettingsInput["aiApprovalMode"],
              }))
            }
          >
            <option value="require_approval">Require approval before sending</option>
            <option value="auto_send">Auto-send replies</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground-muted">
            Tone of voice
          </label>
          <input
            className={inputClass}
            value={form.aiTone}
            onChange={(e) => setForm((f) => ({ ...f, aiTone: e.target.value }))}
          />
        </div>
        <Toggle
          label="Follow-up automation"
          checked={form.followUpAutomation}
          onChange={(v) => setForm((f) => ({ ...f, followUpAutomation: v }))}
        />
        <Toggle
          label="Viewing booking automation"
          checked={form.viewingBookingAutomation}
          onChange={(v) => setForm((f) => ({ ...f, viewingBookingAutomation: v }))}
        />
        <Toggle
          label="New lead automation"
          checked={form.newLeadAutomation}
          onChange={(v) => setForm((f) => ({ ...f, newLeadAutomation: v }))}
        />
      </section>

      {/* Quiet hours */}
      <section className="space-y-3 border-t border-border pt-6">
        <h3 className="text-sm font-semibold">Quiet hours</h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-foreground-muted">Start</label>
            <input
              type="time"
              className={inputClass}
              value={form.quietHoursStart}
              onChange={(e) => setForm((f) => ({ ...f, quietHoursStart: e.target.value }))}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-foreground-muted">End</label>
            <input
              type="time"
              className={inputClass}
              value={form.quietHoursEnd}
              onChange={(e) => setForm((f) => ({ ...f, quietHoursEnd: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground-muted">
            Active days <span className="font-normal">(none = every day)</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DAYS.map((label, d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium",
                  form.quietHoursDays.includes(d)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-surface-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground-muted">
            Auto-response message
          </label>
          <textarea
            className={inputClass}
            rows={2}
            value={form.quietHoursMessage}
            onChange={(e) => setForm((f) => ({ ...f, quietHoursMessage: e.target.value }))}
          />
        </div>
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

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-3">
      <span>
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-foreground-muted">{hint}</span>}
      </span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-surface-muted",
        )}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </label>
  );
}
