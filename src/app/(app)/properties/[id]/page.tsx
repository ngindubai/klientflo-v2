import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Users, Handshake } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MatchBadge } from "@/components/properties/match-badge";
import { InfoPackButton } from "@/components/properties/info-pack-button";
import { getProperty } from "@/server/properties";
import { getMatchingClients } from "@/server/matching";
import { formatAED } from "@/lib/utils";
import { humanizeEnum } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  const matches = await getMatchingClients(id);

  const facts: [string, string | null][] = [
    ["Type", property.propertyType],
    ["Bedrooms", property.bedrooms?.toString() ?? null],
    ["Bathrooms", property.bathrooms?.toString() ?? null],
    ["Size", property.sizeSqft ? `${property.sizeSqft.toLocaleString()} sqft` : null],
    ["Area", property.area],
    ["Community", property.community],
    ["Permit", property.permitNumber],
    ["Source", humanizeEnum(property.source)],
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/properties" className="text-sm text-foreground-muted hover:underline">
            ← Properties
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{property.title}</h1>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatAED(property.price)}
            <span className="ml-2 align-middle text-xs font-medium text-foreground-muted">
              {humanizeEnum(property.status)}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <InfoPackButton propertyId={property.id} />
          <Link
            href={`/properties/${property.id}/edit`}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
          >
            <Pencil className="size-4" /> Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Details</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-3">
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-foreground-muted">{label}</dt>
                  <dd className="font-medium">{value ?? "—"}</dd>
                </div>
              ))}
            </dl>
            {property.description && (
              <p className="mt-4 text-sm text-foreground-muted">{property.description}</p>
            )}
            {property.paymentPlan && (
              <p className="mt-3 rounded-lg bg-surface-muted p-3 text-sm">
                <span className="font-medium">Payment plan: </span>
                {property.paymentPlan}
              </p>
            )}
            {property.listingUrl && (
              <a
                href={property.listingUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
              >
                View listing ↗
              </a>
            )}
          </Card>

          <RelatedCard title="Deals" icon={Handshake} count={property.deals.length}>
            {property.deals.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-2 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.client?.name ?? "Unassigned"}</p>
                  <p className="text-xs text-foreground-muted">
                    {d.type === "sale" ? "Sale" : "Rental"} · {humanizeEnum(d.stage)}
                  </p>
                </div>
              </li>
            ))}
          </RelatedCard>
        </div>

        {/* Matching clients (reverse match) */}
        <div className="lg:col-span-1">
          <Card>
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Users className="size-4 text-foreground-muted" />
              <h2 className="text-sm font-semibold">Best-matched clients</h2>
            </div>
            {matches.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-foreground-muted">
                No strong client matches yet.
              </p>
            ) : (
              <ul className="divide-y divide-border p-2">
                {matches.map(({ client, match }) => (
                  <li key={client.id}>
                    <Link
                      href={`/clients/${client.id}`}
                      className="block rounded-lg px-2 py-2.5 hover:bg-surface-muted"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{client.name}</span>
                        <MatchBadge score={match.score} />
                      </div>
                      {match.reasons.length > 0 && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-foreground-muted">
                          {match.reasons.join(" · ")}
                        </p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function RelatedCard({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Icon className="size-4 text-foreground-muted" />
        <h2 className="text-sm font-semibold">{title}</h2>
        {count > 0 && (
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-foreground-muted">
            {count}
          </span>
        )}
      </div>
      {count === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-foreground-muted">None yet.</p>
      ) : (
        <ul className="divide-y divide-border p-2">{children}</ul>
      )}
    </Card>
  );
}
