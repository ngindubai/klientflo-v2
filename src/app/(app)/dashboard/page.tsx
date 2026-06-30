import {
  AlertTriangle,
  Flame,
  Reply,
  Sparkles,
  Eye,
  CalendarClock,
  Handshake,
  FileWarning,
  Mic,
  Clock,
  MapPin,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { WidgetCard, WidgetRow } from "@/components/dashboard/widget-card";
import { UrgencyBadge } from "@/components/dashboard/urgency-badge";
import { getDashboardData } from "@/server/dashboard";
import { formatAED, formatRelativeTime, formatTime } from "@/lib/utils";
import { humanizeEnum } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Display name for a conversation: prefer the linked client, then the saved
// contact name, then the raw phone number.
function convName(c: {
  client: { name: string } | null;
  contactName: string | null;
  contactPhone: string;
}) {
  return c.client?.name ?? c.contactName ?? c.contactPhone;
}

export default async function DashboardPage() {
  const d = await getDashboardData();

  return (
    <>
      <PageHeader
        title={`Good day, ${d.agent.name.split(" ")[0]}`}
        description="Here's what needs your attention today."
      />

      {/* Headline stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="Urgent" value={d.counts.urgent} accent="urgent" />
        <StatCard label="Pending replies" value={d.counts.pending} />
        <StatCard label="Suggested actions" value={d.counts.actions} />
      </div>

      {/* Widgets — equal-height cards with internal scroll keep the grid aligned
          regardless of how many items each section has. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {/* Urgent messages */}
        <WidgetCard
          title="Urgent Messages"
          icon={AlertTriangle}
          count={d.urgentMessages.length}
          viewAllHref="/inbox"
          empty="No urgent messages — nicely on top of things."
        >
          {d.urgentMessages.map((c) => (
            <WidgetRow key={c.id} href="/inbox">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{convName(c)}</span>
                  <UrgencyBadge level={c.urgency} />
                </div>
                <p className="mt-0.5 line-clamp-2 text-sm text-foreground-muted">
                  {c.summary ?? humanizeEnum(c.classification ?? "new_enquiry")}
                </p>
              </div>
            </WidgetRow>
          ))}
        </WidgetCard>

        {/* AI suggested actions */}
        <WidgetCard
          title="AI Suggested Actions"
          icon={Sparkles}
          count={d.suggestedActions.length}
          empty="No suggestions right now."
        >
          {d.suggestedActions.map((a) => (
            <WidgetRow key={a.id}>
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{a.label}</p>
                {a.reason && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-foreground-muted">
                    {a.reason}
                  </p>
                )}
              </div>
            </WidgetRow>
          ))}
        </WidgetCard>

        {/* Pending replies */}
        <WidgetCard
          title="Pending Replies"
          icon={Reply}
          count={d.pendingReplies.length}
          viewAllHref="/inbox"
          empty="You're all caught up."
        >
          {d.pendingReplies.map((c) => (
            <WidgetRow key={c.id} href="/inbox">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{convName(c)}</span>
                  {c.lastMessageAt && (
                    <span className="shrink-0 text-xs text-foreground-muted">
                      {formatRelativeTime(c.lastMessageAt)}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 line-clamp-1 text-sm text-foreground-muted">
                  {c.summary ?? "Awaiting your reply"}
                </p>
              </div>
            </WidgetRow>
          ))}
        </WidgetCard>

        {/* Today's viewings */}
        <WidgetCard
          title="Today's Viewings"
          icon={Eye}
          count={d.todaysViewings.length}
          viewAllHref="/calendar"
          empty="No viewings scheduled today."
        >
          {d.todaysViewings.map((e) => (
            <WidgetRow key={e.id} href="/calendar">
              <span className="mt-0.5 inline-flex items-center gap-1 rounded-md bg-primary-muted px-2 py-0.5 text-xs font-semibold text-primary">
                <Clock className="size-3" />
                {formatTime(e.startsAt)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.title}</p>
                {e.location && (
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-foreground-muted">
                    <MapPin className="size-3" /> {e.location}
                  </p>
                )}
              </div>
            </WidgetRow>
          ))}
        </WidgetCard>

        {/* Today's meetings */}
        <WidgetCard
          title="Today's Meetings"
          icon={CalendarClock}
          count={d.todaysMeetings.length}
          viewAllHref="/calendar"
          empty="No meetings scheduled today."
        >
          {d.todaysMeetings.map((e) => (
            <WidgetRow key={e.id} href="/calendar">
              <span className="mt-0.5 inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-0.5 text-xs font-semibold text-foreground-muted">
                <Clock className="size-3" />
                {formatTime(e.startsAt)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.title}</p>
                <p className="mt-0.5 text-xs text-foreground-muted">
                  {humanizeEnum(e.type)}
                </p>
              </div>
            </WidgetRow>
          ))}
        </WidgetCard>

        {/* Hot leads */}
        <WidgetCard
          title="Hot Leads"
          icon={Flame}
          count={d.hotLeads.length}
          viewAllHref="/clients"
          empty="No hot leads flagged yet."
        >
          {d.hotLeads.map((c) => (
            <WidgetRow key={c.id} href="/clients">
              <Flame className="mt-0.5 size-4 shrink-0 text-urgency-4" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{convName(c)}</span>
                  <span className="shrink-0 text-xs font-medium text-foreground-muted">
                    {humanizeEnum(c.classification ?? "hot_lead")}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-sm text-foreground-muted">
                  {c.summary ?? "Showing strong intent"}
                </p>
              </div>
            </WidgetRow>
          ))}
        </WidgetCard>

        {/* Deals requiring attention */}
        <WidgetCard
          title="Deals Requiring Attention"
          icon={Handshake}
          count={d.dealsNeedingAttention.length}
          empty="No active deals right now."
        >
          {d.dealsNeedingAttention.map((deal) => (
            <WidgetRow key={deal.id} href={`/pipeline?type=${deal.type}`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">
                    {deal.client?.name ?? "Unassigned"}
                  </span>
                  <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-foreground-muted">
                    {deal.type === "sale" ? "Sale" : "Rental"}
                  </span>
                </div>
                <p className="mt-0.5 flex items-center justify-between gap-2 text-sm text-foreground-muted">
                  <span className="truncate">{humanizeEnum(deal.stage)}</span>
                  {deal.amount && (
                    <span className="shrink-0 tabular-nums">
                      {formatAED(deal.amount)}
                    </span>
                  )}
                </p>
              </div>
            </WidgetRow>
          ))}
        </WidgetCard>

        {/* Documents needing attention */}
        <WidgetCard
          title="Missing & Expiring Documents"
          icon={FileWarning}
          count={d.dealsAwaitingDocs.length + d.expiringDocuments.length}
          viewAllHref="/documents"
          empty="No document gaps or expiries."
        >
          {d.dealsAwaitingDocs.map((deal) => (
            <WidgetRow key={`deal-${deal.id}`}>
              <FileWarning className="mt-0.5 size-4 shrink-0 text-urgency-3" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {deal.client?.name ?? "Unassigned"}
                </p>
                <p className="text-xs text-foreground-muted">
                  Documents requested — outstanding
                </p>
              </div>
            </WidgetRow>
          ))}
          {d.expiringDocuments.map((doc) => (
            <WidgetRow key={`doc-${doc.id}`} href="/documents">
              <Clock className="mt-0.5 size-4 shrink-0 text-urgency-4" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{doc.name}</p>
                <p className="text-xs text-foreground-muted">
                  Expires soon — {doc.expiresAt?.toLocaleDateString("en-GB")}
                </p>
              </div>
            </WidgetRow>
          ))}
        </WidgetCard>

        {/* New voice notes */}
        <WidgetCard
          title="New Voice Notes"
          icon={Mic}
          count={d.newVoiceNotes.length}
          viewAllHref="/inbox"
          empty="No voice notes to review."
        >
          {d.newVoiceNotes.map((m) => (
            <WidgetRow key={m.id} href="/inbox">
              <Mic className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">
                    {m.conversation.client?.name ??
                      m.conversation.contactName ??
                      m.conversation.contactPhone}
                  </span>
                  <span className="shrink-0 text-xs text-foreground-muted">
                    {formatRelativeTime(m.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-sm italic text-foreground-muted">
                  {m.transcription
                    ? `“${m.transcription}”`
                    : "Awaiting transcription"}
                </p>
              </div>
            </WidgetRow>
          ))}
        </WidgetCard>
      </div>
    </>
  );
}
