import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "urgent" | "default";
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-3xl font-semibold tabular-nums",
          accent === "urgent" && value > 0
            ? "text-urgency-5"
            : "text-foreground",
        )}
      >
        {value}
      </p>
    </Card>
  );
}
