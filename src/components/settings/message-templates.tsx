"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";
import {
  addMessageTemplate,
  deleteMessageTemplate,
} from "@/server/settings-actions";
import type { MessageTemplate } from "@/server/settings";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";

/**
 * Manage reusable WhatsApp message templates (e.g. owner-outreach presets).
 * These appear as presets when messaging owners.
 */
export function MessageTemplates({
  templates,
}: {
  templates: MessageTemplate[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        await addMessageTemplate(name, body);
        setName("");
        setBody("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add template.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-foreground-muted">
        Reusable messages for owner outreach and quick replies. They show up as
        one-tap presets when you message owners.
      </p>

      {templates.length > 0 && (
        <ul className="space-y-2">
          {templates.map((t) => (
            <li
              key={t.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="mt-0.5 text-xs text-foreground-muted">{t.body}</p>
              </div>
              <form action={deleteMessageTemplate.bind(null, t.id)}>
                <button
                  type="submit"
                  className="rounded-md border border-border p-1.5 text-foreground-muted hover:bg-surface-muted"
                  title="Delete template"
                >
                  <Trash2 className="size-4" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Template name (e.g. Sale outreach)"
          className={inputClass}
        />
        <textarea
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="I have a client looking for your property who is ready to purchase. Would you consider selling?"
          className={inputClass}
        />
        {error && (
          <p className="rounded-lg bg-urgency-5/10 px-3 py-2 text-sm text-urgency-5">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          <Plus className="size-4" /> {pending ? "Adding…" : "Add template"}
        </button>
      </form>
    </div>
  );
}
