"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Mic, ArrowUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { runCommand } from "@/server/ai/command";
import type { CommandResult } from "@/server/ai/command-types";
import { CommandResultPanel } from "@/components/ai/command-result";
import { useSpeechRecognition } from "@/components/voice/use-speech-recognition";

// Rotating examples that hint at what the assistant can do.
const EXAMPLES = [
  "Show urgent WhatsApps",
  "Find 2-bed apartments in Dubai Marina under AED 2M",
  "Show today's meetings",
  "Move Ahmed Khan to viewing booked",
  "Reply saying I'll confirm availability shortly",
  "Show pending replies",
  "Find hot buyers",
  "Open the inbox",
];

export function CommandBar() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CommandResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const speech = useSpeechRecognition(setValue);

  useEffect(() => {
    if (value) return;
    const t = setInterval(
      () => setPlaceholderIndex((i) => (i + 1) % EXAMPLES.length),
      3500,
    );
    return () => clearInterval(t);
  }, [value]);

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
    if (!command || isPending) return;
    setValue("");
    startTransition(async () => {
      setError("");
      try {
      const res = await runCommand(command);
      if (res.kind === "navigate") {
        setResult(null);
        router.push(res.href);
        return;
      }
      setResult(res);
      // Refresh server components in case a command mutated data (e.g. move_deal).
      router.refresh();
      } catch { setValue(command); setError("Could not run that command. Please try again."); }
    });
  }

  return (
    <div className="relative min-w-0 flex-1">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 rounded-[var(--radius-card)] border border-border bg-surface px-3 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <Sparkles className="size-5 shrink-0 text-primary" />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Ask or command — e.g. “${EXAMPLES[placeholderIndex]}”`}
            className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-muted"
            aria-label="AI command bar"
          />
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-foreground-muted sm:inline">
            ⌘K
          </kbd>
          <button
            type="button"
            onClick={() => speech.toggle(value)}
            disabled={!speech.supported}
            title={
              speech.supported
                ? "Voice input"
                : "Voice input isn't supported in this browser"
            }
            className={cn(
              "rounded-lg p-2 transition-colors",
              speech.listening
                ? "animate-pulse bg-urgency-5/10 text-urgency-5"
                : "text-foreground-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-40",
            )}
            aria-label="Voice input"
          >
            <Mic className="size-5" />
          </button>
          <button
            type="submit"
            disabled={!value.trim() || isPending}
            className={cn(
              "rounded-lg p-2 transition-colors",
              value.trim() && !isPending
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-surface-muted text-foreground-muted",
            )}
            aria-label="Send command"
          >
            {isPending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <ArrowUp className="size-5" />
            )}
          </button>
        </div>
      </form>

      {(error || speech.error) && <div role="status" className="absolute right-0 left-0 z-40 mt-2 rounded-lg border border-border bg-surface p-3 text-xs shadow-lg">{error || speech.error}<button className="ml-2 text-primary underline" onClick={() => { setError(""); speech.clearError(); }}>Dismiss</button></div>}
      {result && (
        <CommandResultPanel result={result} onClose={() => setResult(null)} />
      )}
    </div>
  );
}
