import { cn } from "@/lib/utils";

// A coloured match-percentage pill: green (strong) → amber → orange.
export function MatchBadge({ score }: { score: number }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold text-white",
        score >= 80 ? "bg-accent" : score >= 60 ? "bg-urgency-3" : "bg-urgency-4",
      )}
    >
      {score}% match
    </span>
  );
}
