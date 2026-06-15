"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Mic, ArrowUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { runCommand } from "@/server/ai/command";
import type { CommandResult } from "@/server/ai/command-types";
import { CommandResultPanel } from "@/components/ai/command-result";

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
  const [result, setResult] = useState<CommandResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

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
      const res = await runCommand(command);
      if (res.kind === "navigate") {
        setResult(null);
        router.push(res.href);
        return;
      }
      setResult(res);
      // Refresh server components in case a command mutated data (e.g. move_deal).
      router.refresh();
    });
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

      {result && (
        <CommandResultPanel result={result} onClose={() => setResult(null)} />
      )}
    </div>
  );
}
