import Link from "next/link";
import { Plus, MapPin, Building2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Pager } from "@/components/ui/pager";
import { ContactFilters } from "@/components/clients/contact-filters";
import { ContactsTable } from "@/components/clients/contacts-table";
import { UrgencyBadge } from "@/components/dashboard/urgency-badge";
import {
  getClients,
  getContactsCount,
  getContactAreas,
  CONTACTS_PAGE_SIZE,
} from "@/server/clients";
import { getMessageTemplates } from "@/server/settings";
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
 * line, plus a search + area filter. Contacts link to /clients/[id].
 */
export async function ContactsSection({
  config,
  query,
  area,
  page = 1,
  basePath,
  variant = "cards",
}: {
  config: SectionConfig;
  query?: string;
  area?: string;
  page?: number;
  basePath: string;
  variant?: "cards" | "table";
}) {
  const filters = { query, area };
  const [contacts, total, areas] = await Promise.all([
    getClients(filters, config.category, page),
    getContactsCount(filters, config.category),
    getContactAreas(config.category),
  ]);
  const templates =
    variant === "table" ? await getMessageTemplates() : [];

  const isInvestor = config.category === "investor";

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

      <ContactFilters
        basePath={basePath}
        areas={areas}
        placeholder={config.searchPlaceholder}
      />

      {contacts.length === 0 ? (
        <Card className="p-10 text-center text-sm text-foreground-muted">
          {query || area ? "No matches for these filters." : config.emptyText}
        </Card>
      ) : variant === "table" ? (
        <Card className="p-2 md:p-4">
          <ContactsTable
            category={config.category === "agent" ? "agent" : config.category === "investor" ? "investor" : "client"}
            templates={templates}
            contacts={contacts.map((c) => ({
              id: c.id,
              name: c.name,
              phone: c.phone,
              area: c.area,
              budgetMax: c.budgetMax,
              agencyName: c.agencyName,
              notes: c.notes,
              clientType: c.clientType,
              status: c.status,
            }))}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {contacts.map((c) => {
            const subtitle =
              config.category === "agent"
                ? [c.agencyName, c.phone].filter(Boolean).join(" · ")
                : [
                    isInvestor
                      ? "Investor"
                      : c.clientType && humanizeEnum(c.clientType),
                    c.phone,
                  ]
                    .filter(Boolean)
                    .join(" · ");
            return (
              <Card key={c.id} className="flex h-full flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/clients/${c.id}`}
                      className="truncate font-medium hover:text-primary"
                    >
                      {c.name}
                    </Link>
                    <p className="truncate text-xs text-foreground-muted">
                      {subtitle || c.phone}
                    </p>
                  </div>
                  {c.maxUrgency >= 4 && <UrgencyBadge level={c.maxUrgency} />}
                </div>

                {/* Target area — prominent for investors/clients so they can be
                    matched to available properties. */}
                {c.area && (
                  <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <MapPin className="size-3.5 text-primary" />
                    {isInvestor ? "Looking in " : ""}
                    {c.area}
                  </p>
                )}

                <dl className="mt-2 space-y-1 text-xs text-foreground-muted">
                  {(c.bedrooms || c.propertyType) && (
                    <div className="truncate">
                      {[c.bedrooms ? `${c.bedrooms} bed` : null, c.propertyType]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  )}
                  {c.budgetMax != null && (
                    <div>
                      {isInvestor ? "Ticket up to " : "Budget up to "}
                      {formatAED(c.budgetMax)}
                    </div>
                  )}
                </dl>

                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                  {c.status ? (
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-foreground-muted">
                      {c.status}
                    </span>
                  ) : (
                    <span />
                  )}
                  {c.area && (
                    <Link
                      href={`/properties?area=${encodeURIComponent(c.area)}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <Building2 className="size-3.5" /> Matching properties
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Pager
        page={page}
        pageSize={CONTACTS_PAGE_SIZE}
        total={total}
        basePath={basePath}
        query={{
          ...(query ? { q: query } : {}),
          ...(area ? { area } : {}),
        }}
      />
    </>
  );
}
