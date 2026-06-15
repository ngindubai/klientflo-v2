import { Sparkles } from "lucide-react";

// Lightweight placeholder for sections that get built in later chunks.
export function ComingSoon({ chunk }: { chunk: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-border bg-surface/50 p-10 text-center">
      <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary-muted text-primary">
        <Sparkles className="size-6" />
      </span>
      <p className="font-medium">Building this next</p>
      <p className="mt-1 max-w-sm text-sm text-foreground-muted">
        Arrives in {chunk}. The layout, navigation, and AI command bar are
        already live across every page.
      </p>
    </div>
  );
}
