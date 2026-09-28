"use client";

import { useState, useTransition } from "react";
import { Send, Sparkles, Mic, AlertTriangle } from "lucide-react";
import { useSpeechRecognition } from "@/components/voice/use-speech-recognition";
import type { MessageTemplate } from "@/server/settings";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

export type SendResult = { sent: number; failed: number; demo: boolean };

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";

/**
 * Compose and send a WhatsApp message to selected recipients (owners or
 * contacts) — from a preset template, a custom message, voice dictation, or
 * AI-generated text. The concrete send/draft server actions are passed in.
 */
export function RecipientMessageDialog({
  recipientIds,
  count,
  templates,
  noun = "recipient",
  onClose,
  send,
  draft,
}: {
  recipientIds: string[];
  count: number;
  templates: MessageTemplate[];
  noun?: string;
  onClose: () => void;
  send: (ids: string[], message: string) => Promise<SendResult>;
  draft: (brief: string) => Promise<string>;
}) {
  const [message, setMessage] = useState("");
  const [brief, setBrief] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const speech = useSpeechRecognition(setMessage);

  const label = (n: number) => `${n} ${noun}${n === 1 ? "" : "s"}`;

  function generate() {
    setGenerating(true);
    setError(null);
    draft(brief)
      .then((t) => setMessage(t))
      .catch(() => setError("Couldn't generate a message — try a custom one."))
      .finally(() => setGenerating(false));
  }

  function submit() {
    setError(null);
    start(async () => {
      try {
        setResult(await send(recipientIds, message));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not send.");
      }
    });
  }

  return (
    <Modal title={`Message ${label(count)}`} onClose={onClose}>
        {result ? (
          <div className="space-y-3 text-sm">
            <p>
              {result.demo ? "Simulated for" : "Sent to"} <strong>{result.sent}</strong>
              {result.failed > 0 ? `, ${result.failed} skipped (no phone)` : ""}.
            </p>
            {result.demo && (
              <p className="rounded-lg bg-surface-muted px-3 py-2 text-xs text-foreground-muted">
                Demo mode — sending is simulated. The messages appear in your inbox.
              </p>
            )}
            <p className="flex items-start gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              In production, recipients outside the 24-hour window require an
              approved WhatsApp template message.
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-foreground-muted">
                  Preset messages
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setMessage(t.body)}
                      className="rounded-full border border-border px-2.5 py-1 text-xs font-medium hover:border-primary hover:text-primary"
                      title={t.body}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-border bg-surface-muted/40 p-2">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground-muted">
                <Sparkles className="size-3.5 text-primary" /> Generate with AI
              </p>
              <div className="flex gap-1.5">
                <input
                  aria-label="Message brief"
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="e.g. buyer ready at 2.5M for a 2-bed"
                  className={`${inputClass} min-w-0`}
                />
                <button
                  type="button"
                  onClick={generate}
                  disabled={generating}
                  className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {generating ? "…" : "Generate"}
                </button>
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-medium text-foreground-muted">
                  Message
                </label>
                {speech.supported && (
                  <button
                    type="button"
                    onClick={() => speech.toggle(message)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
                      speech.listening
                        ? "bg-urgency-5/10 text-urgency-5"
                        : "text-foreground-muted hover:bg-surface-muted",
                    )}
                  >
                    <Mic className="size-3.5" />
                    {speech.listening ? "Stop" : "Dictate"}
                  </button>
                )}
              </div>
              <textarea
                aria-label="Message to selected contacts"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a message, pick a preset, dictate, or generate one…"
                className={`${inputClass} min-w-0`}
              />
            </div>

            {(error || speech.error) && (
              <p className="rounded-lg bg-urgency-5/10 px-3 py-2 text-sm text-urgency-5">
                {error || speech.error}
              </p>
            )}

            <button
              onClick={submit}
              disabled={pending || !message.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Send className="size-4" />
              {pending ? "Sending…" : `Send to ${label(count)}`}
            </button>
          </div>
        )}
    </Modal>
  );
}
