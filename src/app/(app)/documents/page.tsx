import Link from "next/link";
import { Upload, FileText, FileWarning, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { DeleteDocButton } from "@/components/documents/delete-doc-button";
import { DocumentFilters } from "@/components/documents/document-filters";
import { getDocuments, getMissingDocuments } from "@/server/documents";
import { humanizeEnum, DOCUMENT_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;

function expiryBadge(expiresAt: Date | null) {
  if (!expiresAt) return null;
  const diff = expiresAt.getTime() - Date.now();
  const label = expiresAt.toLocaleDateString("en-GB");
  if (diff < 0)
    return { text: `Expired ${label}`, class: "bg-urgency-5/10 text-urgency-5" };
  if (diff < 30 * DAY)
    return { text: `Expires ${label}`, class: "bg-urgency-3/10 text-urgency-3" };
  return { text: `Expires ${label}`, class: "bg-surface-muted text-foreground-muted" };
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; expiry?: string }>;
}) {
  const { q, category, expiry } = await searchParams;
  const anyFilter = Boolean(q || category || expiry);
  const [documents, missing] = await Promise.all([
    getDocuments({ q, category, expiry }),
    getMissingDocuments(),
  ]);

  return (
    <>
      <PageHeader
        title="Documents"
        description="Client, property and transaction documents with expiry reminders."
        action={
          <Link
            href="/documents/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Upload className="size-4" /> Upload
          </Link>
        }
      />

      <DocumentFilters />

      {missing.length > 0 && (
        <Card className="mb-4 border-urgency-4/30 bg-urgency-4/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <FileWarning className="size-4 text-urgency-4" />
            <h2 className="text-sm font-semibold">Missing documents</h2>
          </div>
          <ul className="space-y-1.5 text-sm">
            {missing.map((m) => (
              <li key={m.dealId} className="flex flex-wrap items-center gap-2">
                <Link
                  href={m.client ? `/clients/${m.client.id}` : "#"}
                  className="font-medium hover:underline"
                >
                  {m.client?.name ?? "Client"}
                </Link>
                <span className="text-foreground-muted">
                  ({m.type === "sale" ? "Sale" : "Rental"}) needs:
                </span>
                {m.missing.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-urgency-4/10 px-2 py-0.5 text-xs font-medium text-urgency-4"
                  >
                    {humanizeEnum(t)}
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {anyFilter && documents.length === 0 && (
        <Card className="p-10 text-center text-sm text-foreground-muted">
          No documents match these filters.
        </Card>
      )}

      <div className="space-y-4">
        {DOCUMENT_CATEGORIES.map((cat) => {
          const docs = documents.filter((d) => d.category === cat);
          // When filtering, hide categories with no matches to keep it tidy.
          if (anyFilter && docs.length === 0) return null;
          return (
            <Card key={cat}>
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <FileText className="size-4 text-foreground-muted" />
                <h2 className="text-sm font-semibold">{humanizeEnum(cat)} documents</h2>
                {docs.length > 0 && (
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-foreground-muted">
                    {docs.length}
                  </span>
                )}
              </div>
              {docs.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-foreground-muted">
                  None yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {docs.map((d) => {
                    const badge = expiryBadge(d.expiresAt);
                    return (
                      <li
                        key={d.id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{d.name}</p>
                          <p className="truncate text-xs text-foreground-muted">
                            {humanizeEnum(d.type)}
                            {d.client ? ` · ${d.client.name}` : ""}
                            {d.property ? ` · ${d.property.title}` : ""}
                          </p>
                        </div>
                        {badge && (
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                              badge.class,
                            )}
                          >
                            {badge.text}
                          </span>
                        )}
                        {d.fileUrl && (
                          <a
                            href={d.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 rounded-md p-1.5 text-foreground-muted hover:bg-surface-muted hover:text-foreground"
                            aria-label="Preview"
                          >
                            <ExternalLink className="size-4" />
                          </a>
                        )}
                        <DeleteDocButton id={d.id} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
