import { MessageCircle, Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Pager } from "@/components/ui/pager";
import { OwnerImport } from "@/components/owners/owner-import";
import { OwnerFilters } from "@/components/owners/owner-filters";
import {
  getOwners,
  getOwnersCount,
  getOwnerFacets,
  OWNERS_PAGE_SIZE,
} from "@/server/owners";

export const dynamic = "force-dynamic";

/** Strip a phone down to digits for a wa.me link. */
function waLink(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}`;
}

export default async function OwnersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    area?: string;
    building?: string;
    page?: string;
  }>;
}) {
  const { q, area, building, page } = await searchParams;
  const filters = { query: q, area, building };
  const currentPage = Number(page) || 1;
  const [owners, facets, total] = await Promise.all([
    getOwners(filters, currentPage),
    getOwnerFacets(),
    getOwnersCount(filters),
  ]);

  return (
    <>
      <PageHeader
        title="Owners"
        description="Bulk-uploaded property owners, searchable by area and building."
      />

      <div className="mb-4">
        <OwnerImport total={facets.total} />
      </div>

      {facets.total === 0 ? (
        <Card className="p-10 text-center text-sm text-foreground-muted">
          No owners yet — upload a CSV to get started.
        </Card>
      ) : (
        <Card className="p-4">
          <div className="mb-3">
            <OwnerFilters areas={facets.areas} buildings={facets.buildings} />
          </div>

          {owners.length === 0 ? (
            <p className="py-8 text-center text-sm text-foreground-muted">
              No owners match these filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-muted">
                    <th className="px-2 py-2 font-medium">Name</th>
                    <th className="px-2 py-2 font-medium">Building</th>
                    <th className="px-2 py-2 font-medium">Unit</th>
                    <th className="px-2 py-2 font-medium">Area</th>
                    <th className="px-2 py-2 font-medium">Phone</th>
                    <th className="px-2 py-2 text-right font-medium">Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {owners.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-border/60 last:border-0 hover:bg-surface-muted/50"
                    >
                      <td className="px-2 py-2">
                        <div className="font-medium">{o.name}</div>
                        {o.notes && (
                          <div className="truncate text-xs text-foreground-muted">
                            {o.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 text-foreground-muted">{o.building ?? "—"}</td>
                      <td className="px-2 py-2 text-foreground-muted">{o.unit ?? "—"}</td>
                      <td className="px-2 py-2 text-foreground-muted">{o.area ?? "—"}</td>
                      <td className="px-2 py-2 text-foreground-muted">{o.phone ?? "—"}</td>
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-end gap-1.5">
                          {o.phone && (
                            <>
                              <a
                                href={waLink(o.phone)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="WhatsApp"
                                className="rounded-md border border-border p-1.5 text-emerald-600 hover:bg-surface-muted"
                              >
                                <MessageCircle className="size-4" />
                              </a>
                              <a
                                href={`tel:${o.phone}`}
                                title="Call"
                                className="rounded-md border border-border p-1.5 text-foreground-muted hover:bg-surface-muted"
                              >
                                <Phone className="size-4" />
                              </a>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pager
            page={currentPage}
            pageSize={OWNERS_PAGE_SIZE}
            total={total}
            basePath="/owners"
            query={{
              ...(q ? { q } : {}),
              ...(area ? { area } : {}),
              ...(building ? { building } : {}),
            }}
          />
        </Card>
      )}
    </>
  );
}
