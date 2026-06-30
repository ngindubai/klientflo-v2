import Link from "next/link";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { ReportDateRange } from "@/components/reports/report-date-range";
import { Donut } from "@/components/reports/donut";
import { getReport, REPORT_RANGES, type ReportRange } from "@/server/reporting";
import { formatMinutes } from "@/lib/reporting-calc";
import { formatAED } from "@/lib/utils";
import {
  CONTACT_CATEGORY_LABELS,
  humanizeEnum,
  type ContactCategory,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

function catLabel(c: string) {
  return c in CONTACT_CATEGORY_LABELS
    ? CONTACT_CATEGORY_LABELS[c as ContactCategory]
    : "Untagged";
}

/** Minimal horizontal bar list — no chart dependency. */
function BarList({
  rows,
}: {
  rows: { label: string; count: number }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3 text-sm">
          <span className="w-24 shrink-0 truncate text-foreground-muted sm:w-36">
            {r.label}
          </span>
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </span>
          <span className="w-8 shrink-0 text-right font-medium tabular-nums">
            {r.count}
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const { range, from, to } = await searchParams;
  const custom = Boolean(from || to);
  const days = (REPORT_RANGES.includes(Number(range) as ReportRange)
    ? Number(range)
    : 30) as ReportRange;
  const report = await getReport(custom ? { from, to } : { days });

  // Preserve the active window in the export link.
  const exportQuery = custom
    ? new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) })
    : new URLSearchParams({ range: String(days) });

  const kpis = [
    { label: "WhatsApp messages", value: report.kpis.messagesTotal },
    { label: "Incoming", value: report.kpis.inbound },
    { label: "Sent", value: report.kpis.outbound },
    { label: "New leads", value: report.kpis.newConversations },
    { label: "Viewings booked", value: report.kpis.viewingsBooked },
    {
      label: "Median response",
      value: formatMinutes(report.kpis.medianResponseMinutes),
    },
  ];

  return (
    <>
      <PageHeader
        title="Reports"
        description={`WhatsApp activity and pipeline metrics · ${report.label}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 text-sm">
              {REPORT_RANGES.map((r) => (
                <Link
                  key={r}
                  href={`/reports?range=${r}`}
                  className={
                    "rounded-md px-3 py-1.5 font-medium " +
                    (!custom && r === days
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground-muted hover:bg-surface-muted")
                  }
                >
                  {r}d
                </Link>
              ))}
            </div>
            <ReportDateRange from={from} to={to} />
            <a
              href={`/api/reports/pdf?${exportQuery.toString()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Download className="size-4" /> Export PDF
            </a>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <p className="text-2xl font-semibold tabular-nums">{k.value}</p>
            <p className="mt-1 text-xs text-foreground-muted">{k.label}</p>
          </Card>
        ))}
      </div>

      {/* Deal snapshot strip */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-2xl font-semibold tabular-nums">
            {formatAED(report.pipelineValue)}
          </p>
          <p className="mt-1 text-xs text-foreground-muted">Open pipeline value</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-semibold tabular-nums text-accent">
            {report.dealOutcomes.won}
          </p>
          <p className="mt-1 text-xs text-foreground-muted">Deals won</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-semibold tabular-nums text-urgency-5">
            {report.dealOutcomes.lost}
          </p>
          <p className="mt-1 text-xs text-foreground-muted">Deals lost</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-semibold tabular-nums">
            {report.dealOutcomes.open}
          </p>
          <p className="mt-1 text-xs text-foreground-muted">Deals open</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Messages by tag</h2>
          {report.messagesByCategory.length === 0 ? (
            <p className="text-sm text-foreground-muted">No messages in this period.</p>
          ) : (
            <Donut
              data={report.messagesByCategory.map((r) => ({
                label: catLabel(r.category),
                value: r.count,
              }))}
            />
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Conversations by type</h2>
          {report.conversationsByClassification.length === 0 ? (
            <p className="text-sm text-foreground-muted">No conversations in this period.</p>
          ) : (
            <Donut
              data={report.conversationsByClassification
                .slice(0, 6)
                .map((r) => ({
                  label: humanizeEnum(r.classification),
                  value: r.count,
                }))}
            />
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Deals by type</h2>
          {report.dealsByType.length === 0 ? (
            <p className="text-sm text-foreground-muted">No deals yet.</p>
          ) : (
            <Donut
              data={report.dealsByType.map((r) => ({
                label: humanizeEnum(r.type),
                value: r.count,
              }))}
            />
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Top demand areas</h2>
          {report.topAreas.length === 0 ? (
            <p className="text-sm text-foreground-muted">No client areas recorded yet.</p>
          ) : (
            <BarList
              rows={report.topAreas.map((r) => ({
                label: r.area,
                count: r.count,
              }))}
            />
          )}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold">Pipeline (all open deals)</h2>
          {report.pipeline.length === 0 ? (
            <p className="text-sm text-foreground-muted">No deals yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
              {report.pipeline.map((p) => (
                <div
                  key={`${p.type}-${p.stage}`}
                  className="flex items-center justify-between gap-3 border-b border-border/60 py-1.5 text-sm"
                >
                  <span className="truncate">
                    <span className="text-foreground-muted">
                      {humanizeEnum(p.type)} ·{" "}
                    </span>
                    {humanizeEnum(p.stage)}
                  </span>
                  <span className="font-medium tabular-nums">{p.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
