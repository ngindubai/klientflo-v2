import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  accent,
  href,
}: {
  label: string;
  value: number;
  accent?: "urgent" | "default";
  href?: string;
}) {
  const body = (
    <>
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
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="kf-card-shadow block rounded-[var(--radius-card)] border border-border bg-surface p-4 transition-colors hover:border-primary/40 hover:bg-surface-muted/40"
      >
        {body}
      </Link>
    );
  }

  return <Card className="p-4">{body}</Card>;
}
