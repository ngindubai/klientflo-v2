import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Pager } from "@/components/ui/pager";
import { OwnerImport } from "@/components/owners/owner-import";
import { OwnerFilters } from "@/components/owners/owner-filters";
import { OwnersTable } from "@/components/owners/owners-table";
import {
  getOwners,
  getOwnersCount,
  getOwnerFacets,
  OWNERS_PAGE_SIZE,
} from "@/server/owners";
import { getMessageTemplates } from "@/server/settings";

export const dynamic = "force-dynamic";

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
  const [owners, facets, total, templates] = await Promise.all([
    getOwners(filters, currentPage),
    getOwnerFacets(),
    getOwnersCount(filters),
    getMessageTemplates(),
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
        <Card className="p-2 md:p-4">
          <div className="mb-3">
            <OwnerFilters areas={facets.areas} buildings={facets.buildings} />
          </div>

          {owners.length === 0 ? (
            <p className="py-8 text-center text-sm text-foreground-muted">
              No owners match these filters.
            </p>
          ) : (
            <OwnersTable
              owners={owners.map((o) => ({
                id: o.id,
                name: o.name,
                phone: o.phone,
                building: o.building,
                unit: o.unit,
                area: o.area,
                notes: o.notes,
              }))}
              templates={templates}
            />
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
