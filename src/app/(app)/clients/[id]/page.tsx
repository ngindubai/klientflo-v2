import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Pencil,
  MessageSquare,
  Handshake,
  FileText,
  CalendarDays,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { UrgencyBadge } from "@/components/dashboard/urgency-badge";
import { AutoFillButton } from "@/components/clients/auto-fill-button";
import { getClient } from "@/server/clients";
import { formatAED, formatTime } from "@/lib/utils";
import { humanizeEnum } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const requirements: [string, string | null][] = [
    ["Type", client.clientType ? humanizeEnum(client.clientType) : null],
    ["Area", client.area],
    ["Bedrooms", client.bedrooms?.toString() ?? null],
    ["Property type", client.propertyType],
    [
      "Budget",
      client.budgetMax != null
        ? `${client.budgetMin != null ? formatAED(client.budgetMin) + " – " : "Up to "}${formatAED(client.budgetMax)}`
        : null,
    ],
    ["Payment", client.paymentMethod ? humanizeEnum(client.paymentMethod) : null],
    ["Timeline", client.timeline],
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/clients"
            className="text-sm text-foreground-muted hover:underline"
          >
            ← Clients
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {client.name}
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {[client.clientType && humanizeEnum(client.clientType), client.phone]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AutoFillButton id={client.id} />
          <Link
            href={`/clients/${client.id}/edit`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Pencil className="size-4" /> Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left column: profile */}
        <div className="space-y-4 lg:col-span-1">
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Requirements</h2>
            <dl className="space-y-2 text-sm">
              {requirements.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="text-foreground-muted">{label}</dt>
                  <dd className="text-right font-medium">{value ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Contact</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Phone" value={client.phone} />
              <Row label="Email" value={client.email} />
              <Row label="Nationality" value={client.nationality} />
            </dl>
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Lead</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Status" value={client.status} />
              <Row label="Next action" value={client.nextAction} />
            </dl>
            {client.notes && (
              <p className="mt-3 rounded-lg bg-surface-muted p-3 text-sm text-foreground-muted">
                {client.notes}
              </p>
            )}
          </Card>
        </div>

        {/* Right column: related records */}
        <div className="space-y-4 lg:col-span-2">
          <RelatedCard title="Conversations" icon={MessageSquare} count={client.conversations.length}>
            {client.conversations.map((c) => (
              <li key={c.id} className="flex items-start gap-3 px-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {c.classification ? humanizeEnum(c.classification) : "Conversation"}
                    </span>
                    <UrgencyBadge level={c.urgency} />
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-foreground-muted">
                    {c.summary ?? `${c.messages.length} messages`}
                  </p>
                </div>
              </li>
            ))}
          </RelatedCard>

          <RelatedCard title="Deals" icon={Handshake} count={client.deals.length}>
            {client.deals.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-2 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {humanizeEnum(d.stage)}
                  </p>
                  <p className="truncate text-xs text-foreground-muted">
                    {d.type === "sale" ? "Sale" : "Rental"}
                    {d.property ? ` · ${d.property.title}` : ""}
                  </p>
                </div>
                {d.amount != null && (
                  <span className="shrink-0 text-sm tabular-nums">{formatAED(d.amount)}</span>
                )}
              </li>
            ))}
          </RelatedCard>

          <RelatedCard title="Documents" icon={FileText} count={client.documents.length}>
            {client.documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-3 px-2 py-2.5">
                <span className="truncate text-sm font-medium">{doc.name}</span>
                <span className="shrink-0 text-xs text-foreground-muted">
                  {humanizeEnum(doc.type)}
                </span>
              </li>
            ))}
          </RelatedCard>

          <RelatedCard title="Calendar" icon={CalendarDays} count={client.events.length}>
            {client.events.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-2 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{e.title}</p>
                  <p className="text-xs text-foreground-muted">{humanizeEnum(e.type)}</p>
                </div>
                <span className="shrink-0 text-xs text-foreground-muted">
                  {e.startsAt.toLocaleDateString("en-GB")} {formatTime(e.startsAt)}
                </span>
              </li>
            ))}
          </RelatedCard>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-foreground-muted">{label}</dt>
      <dd className="text-right font-medium">{value ?? "—"}</dd>
    </div>
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
