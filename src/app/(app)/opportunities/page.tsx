import Link from "next/link";
import { Plus, KanbanSquare, Building2, User } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { getOpportunities, type OpportunityCard } from "@/server/deals";
import { formatAED, formatRelativeTime, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SECTIONS: {
  key: "closing" | "active" | "won" | "lost";
  label: string;
  hint: string;
  accent: string;
}[] = [
  {
    key: "closing",
    label: "Closing",
    hint: "Late-stage — keep momentum",
    accent: "text-urgency-4",
  },
  {
    key: "active",
    label: "Active",
    hint: "In progress",
    accent: "text-primary",
  },
  { key: "won", label: "Won", hint: "Closed won", accent: "text-emerald-600" },
  { key: "lost", label: "Lost", hint: "Closed lost", accent: "text-foreground-muted" },
];

function DealRoom({ deal }: { deal: OpportunityCard }) {
  return (
    <Link
      href={`/pipeline?type=${deal.type}`}
      className="group flex flex-col gap-2 rounded-[var(--radius-card)] border border-border bg-surface p-4 transition-colors hover:border-primary/40 hover:bg-surface-muted/40"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
            deal.type === "sale"
              ? "bg-primary-muted text-primary"
              : "bg-violet-500/15 text-violet-600",
          )}
        >
          {deal.type}
        </span>
        <span className="text-xs text-foreground-muted">
          {formatRelativeTime(deal.updatedAt)}
        </span>
      </div>

      <div className="min-w-0">
        <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
          <User className="size-3.5 shrink-0 text-foreground-muted" />
          {deal.client?.name ?? "Unassigned client"}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-foreground-muted">
          <Building2 className="size-3.5 shrink-0" />
          {deal.property?.title ?? "No property linked"}
        </p>
      </div>

      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="rounded-md bg-surface-muted px-2 py-0.5 text-xs font-medium text-foreground-muted">
          {deal.stageLabel}
        </span>
        {deal.amount != null && (
          <span className="text-sm font-semibold">{formatAED(deal.amount)}</span>
        )}
      </div>
    </Link>
  );
}

export default async function OpportunitiesPage() {
  const { groups, count } = await getOpportunities();

  return (
    <>
      <PageHeader
        title="Opportunities"
        description="Every live deal as its own room — grouped by where it stands, not by stage."
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/pipeline"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground-muted hover:bg-surface-muted"
            >
              <KanbanSquare className="size-4" /> Board view
            </Link>
            <Link
              href="/pipeline/new?type=sale"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="size-4" /> New deal
            </Link>
          </div>
        }
      />

      {count === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface/50 p-10 text-center text-sm text-foreground-muted">
          No deals yet. Use “New deal” to open your first opportunity.
        </div>
      ) : (
        <div className="space-y-8">
          {SECTIONS.map((section) => {
            const deals = groups[section.key];
            if (deals.length === 0) return null;
            return (
              <section key={section.key}>
                <div className="mb-3 flex items-baseline gap-2">
                  <h2 className={cn("text-sm font-semibold", section.accent)}>
                    {section.label}
                  </h2>
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-foreground-muted">
                    {deals.length}
                  </span>
                  <span className="text-xs text-foreground-muted">
                    {section.hint}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {deals.map((deal) => (
                    <DealRoom key={deal.id} deal={deal} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
