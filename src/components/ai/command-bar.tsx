"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Mic, ArrowUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Rotating examples that hint at what the assistant will be able to do.
const EXAMPLES = [
  'Show urgent WhatsApps',
  'Find 2-bed apartments in Dubai Marina under AED 2M',
  'Book a viewing tomorrow at 4pm',
  'Send this client the information pack',
  'Summarise this conversation',
  "Move this lead to viewing booked",
  "Send top 3 matching properties",
  "Reply saying I'll confirm availability shortly",
];

export function CommandBar() {
  const [value, setValue] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [response, setResponse] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cycle the placeholder while the field is empty.
  useEffect(() => {
    if (value) return;
    const t = setInterval(
      () => setPlaceholderIndex((i) => (i + 1) % EXAMPLES.length),
      3500,
    );
    return () => clearInterval(t);
  }, [value]);

  // Focus shortcut: Cmd/Ctrl+K.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const command = value.trim();
    if (!command) return;
    // The AI brain (intent → action) is wired up in Chunks 5–6. For now we
    // acknowledge the command so the interaction is fully in place.
    setResponse(
      `Got it — “${command}”. I'll be able to act on this once the AI assistant is connected (Chunks 5–6).`,
    );
    setValue("");
  }

  return (
    <div className="relative flex-1">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 rounded-[var(--radius-card)] border border-border bg-surface px-3 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <Sparkles className="size-5 shrink-0 text-primary" />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Ask or command — e.g. “${EXAMPLES[placeholderIndex]}”`}
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-muted"
            aria-label="AI command bar"
          />
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-foreground-muted sm:inline">
            ⌘K
          </kbd>
          <button
            type="button"
            title="Voice input — coming in Chunk 13"
            className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            aria-label="Voice input"
          >
            <Mic className="size-5" />
          </button>
          <button
            type="submit"
            disabled={!value.trim()}
            className={cn(
              "rounded-lg p-2 transition-colors",
              value.trim()
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-surface-muted text-foreground-muted",
            )}
            aria-label="Send command"
          >
            <ArrowUp className="size-5" />
          </button>
        </div>
      </form>

      {response && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 flex items-start gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-3 text-sm shadow-lg">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="flex-1 text-foreground-muted">{response}</p>
          <button
            onClick={() => setResponse(null)}
            className="rounded p-0.5 text-foreground-muted hover:bg-surface-muted"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
