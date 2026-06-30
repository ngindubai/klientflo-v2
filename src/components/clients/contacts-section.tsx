import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Pager } from "@/components/ui/pager";
import { UrgencyBadge } from "@/components/dashboard/urgency-badge";
import { getClients, getContactsCount, CONTACTS_PAGE_SIZE } from "@/server/clients";
import { formatAED } from "@/lib/utils";
import { humanizeEnum, type ContactCategory } from "@/lib/constants";

type SectionConfig = {
  category: ContactCategory;
  title: string;
  description: string;
  searchPlaceholder: string;
  emptyText: string;
  newHref?: string;
  newLabel?: string;
};

/**
 * Shared list view for a contact category. Clients, Agents and Investors all
 * render through this — same card grid, category-appropriate copy and detail
 * line. Contacts link to the unified contact detail at /clients/[id].
 */
export async function ContactsSection({
  config,
  query,
  page = 1,
  basePath,
}: {
  config: SectionConfig;
  query?: string;
  page?: number;
  basePath: string;
}) {
  const [contacts, total] = await Promise.all([
    getClients(query, config.category, page),
    getContactsCount(query, config.category),
  ]);

  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        action={
          config.newHref && (
            <Link
              href={config.newHref}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="size-4" /> {config.newLabel}
            </Link>
          )
        }
      />

      <form className="mb-4 flex max-w-md items-center gap-2 rounded-lg border border-border bg-surface px-3">
        <Search className="size-4 text-foreground-muted" />
        <input
          name="q"
          defaultValue={query}
          placeholder={config.searchPlaceholder}
          className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-muted"
        />
      </form>

      {contacts.length === 0 ? (
        <Card className="p-10 text-center text-sm text-foreground-muted">
          {query ? "No matches for your search." : config.emptyText}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {contacts.map((c) => {
            // Category-appropriate secondary line.
            const subtitle =
              config.category === "agent"
                ? [c.agencyName, c.phone].filter(Boolean).join(" · ")
                : [
                    config.category === "investor"
                      ? "Investor"
                      : c.clientType && humanizeEnum(c.clientType),
                    c.phone,
                  ]
                    .filter(Boolean)
                    .join(" · ");
            return (
              <Link key={c.id} href={`/clients/${c.id}`}>
                <Card className="h-full p-4 transition-colors hover:border-primary">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{c.name}</p>
                      <p className="truncate text-xs text-foreground-muted">
                        {subtitle || c.phone}
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
                      <div>
                        {config.category === "investor" ? "Ticket up to " : "Budget up to "}
                        {formatAED(c.budgetMax)}
                      </div>
                    )}
                  </dl>

                  {c.status && (
                    <div className="mt-3">
                      <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-foreground-muted">
                        {c.status}
                      </span>
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Pager
        page={page}
        pageSize={CONTACTS_PAGE_SIZE}
        total={total}
        basePath={basePath}
        query={query ? { q: query } : undefined}
      />
    </>
  );
}
