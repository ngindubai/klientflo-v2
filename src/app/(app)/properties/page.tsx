import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { RefreshSources } from "@/components/properties/refresh-sources";
import { getProperties } from "@/server/properties";
import { getLatestScrapeJob } from "@/server/scrape";
import { getCurrentAgent } from "@/server/agent";
import { formatAED } from "@/lib/utils";
import { humanizeEnum } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-accent-muted text-accent",
  expired: "bg-urgency-5/10 text-urgency-5",
  draft: "bg-surface-muted text-foreground-muted",
};

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const agent = await getCurrentAgent();
  const properties = await getProperties({ q });
  const latestJob = await getLatestScrapeJob(agent.id);
  const initialJob = latestJob
    ? {
        id: latestJob.id,
        status: latestJob.status,
        progress: latestJob.progress,
        imported: latestJob.imported,
        message: latestJob.message,
      }
    : null;

  return (
    <>
      <PageHeader
        title="Properties"
        description="Your portfolio with AI matching and one-click information packs."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <RefreshSources initial={initialJob} />
            <Link
              href="/properties/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="size-4" /> Add property
            </Link>
          </div>
        }
      />

      <form className="mb-4 flex max-w-md items-center gap-2 rounded-lg border border-border bg-surface px-3">
        <Search className="size-4 text-foreground-muted" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search title, area, community, listing ID…"
          className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-muted"
        />
      </form>

      {properties.length === 0 ? (
        <Card className="p-10 text-center text-sm text-foreground-muted">
          {q ? "No properties match your search." : "No properties yet."}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((p) => (
            <Link key={p.id} href={`/properties/${p.id}`}>
              <Card className="h-full p-4 transition-colors hover:border-primary">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium leading-snug">{p.title}</p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_STYLE[p.status],
                    )}
                  >
                    {humanizeEnum(p.status)}
                  </span>
                </div>
                <p className="mt-2 text-lg font-semibold tabular-nums">
                  {formatAED(p.price)}
                </p>
                <p className="mt-1 text-xs text-foreground-muted">
                  {[
                    p.bedrooms ? `${p.bedrooms} bed` : null,
                    p.propertyType,
                    p.area,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="mt-2 text-xs text-foreground-muted">
                  {humanizeEnum(p.source)}
                  {p.listingId ? ` · ${p.listingId}` : ""}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
