import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function WidgetCard({
  title,
  icon: Icon,
  count,
  viewAllHref,
  empty,
  children,
  className,
}: {
  title: string;
  icon: LucideIcon;
  count?: number;
  viewAllHref?: string;
  empty?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const isEmpty = count === 0;
  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-foreground-muted" />
          <h2 className="text-sm font-semibold">{title}</h2>
          {count !== undefined && count > 0 && (
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-foreground-muted tabular-nums">
              {count}
            </span>
          )}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View all <ArrowRight className="size-3" />
          </Link>
        )}
      </div>
      <div className="max-h-72 flex-1 overflow-y-auto p-2">
        {isEmpty ? (
          <p className="flex h-full min-h-24 items-center justify-center px-2 py-6 text-center text-sm text-foreground-muted">
            {empty ?? "Nothing here right now."}
          </p>
        ) : (
          <ul className="divide-y divide-border">{children}</ul>
        )}
      </div>
    </Card>
  );
}

/** A single row inside a WidgetCard, optionally linking somewhere. */
export function WidgetRow({
  href,
  children,
}: {
  href?: string;
  children: React.ReactNode;
}) {
  const content = (
    <div className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-muted">
      {children}
    </div>
  );
  return <li>{href ? <Link href={href}>{content}</Link> : content}</li>;
}
