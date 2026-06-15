import { URGENCY_LABELS, type UrgencyLevel } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Background colour per urgency level, using the design-token scale.
const BG: Record<UrgencyLevel, string> = {
  1: "bg-urgency-1",
  2: "bg-urgency-2",
  3: "bg-urgency-3",
  4: "bg-urgency-4",
  5: "bg-urgency-5",
};

export function UrgencyBadge({ level }: { level: number }) {
  const lvl = Math.min(5, Math.max(1, Math.round(level))) as UrgencyLevel;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-white",
        BG[lvl],
      )}
      title={`Urgency ${lvl} — ${URGENCY_LABELS[lvl]}`}
    >
      {lvl} · {URGENCY_LABELS[lvl]}
    </span>
  );
}
