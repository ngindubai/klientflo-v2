import Link from "next/link";
import { Plus, Search, Flame } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { UrgencyBadge } from "@/components/dashboard/urgency-badge";
import { getClients } from "@/server/clients";
import { formatAED } from "@/lib/utils";
import { humanizeEnum } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const clients = await getClients(q);

  return (
    <>
      <PageHeader
        title="Clients"
        description="Lightweight lead and client records, auto-populated from conversations."
        action={
          <Link
            href="/clients/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" /> New client
          </Link>
        }
      />

      <form className="mb-4 flex max-w-md items-center gap-2 rounded-lg border border-border bg-surface px-3">
        <Search className="size-4 text-foreground-muted" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name, phone, email, area…"
          className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-muted"
        />
      </form>

      {clients.length === 0 ? (
        <Card className="p-10 text-center text-sm text-foreground-muted">
          {q ? "No clients match your search." : "No clients yet — add your first."}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((c) => (
            <Link key={c.id} href={`/clients/${c.id}`}>
              <Card className="h-full p-4 transition-colors hover:border-primary">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="truncate text-xs text-foreground-muted">
                      {[c.clientType && humanizeEnum(c.clientType), c.phone]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {c.maxUrgency >= 4 && <UrgencyBadge level={c.maxUrgency} />}
                </div>

                <dl className="mt-3 space-y-1 text-xs text-foreground-muted">
                  {(c.area || c.bedrooms || c.propertyType) && (
                    <div className="truncate">
                      {[
                        c.bedrooms ? `${c.bedrooms} bed` : null,
                        c.propertyType,
                        c.area,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  )}
                  {c.budgetMax != null && (
                    <div>Budget up to {formatAED(c.budgetMax)}</div>
                  )}
                </dl>

                <div className="mt-3 flex items-center justify-between gap-2">
                  {c.status && (
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-foreground-muted">
                      {c.status}
                    </span>
                  )}
                  {c.status?.toLowerCase().includes("hot") && (
                    <Flame className="size-4 text-urgency-4" />
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
