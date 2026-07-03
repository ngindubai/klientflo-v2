import Link from "next/link";
import {
  AlertTriangle,
  Reply,
  Sparkles,
  Eye,
  CalendarClock,
  Handshake,
  FileWarning,
  Mic,
  Clock,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
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

/** A single actionable row in the priority work queue. */
function QueueItem({
  href,
  title,
  detail,
  badge,
  cta,
  icon: Icon,
  iconClass,
}: {
  href: string;
  title: string;
  detail: string;
  badge?: React.ReactNode;
  cta: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted/50"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted">
        <Icon className={iconClass ?? "size-4 text-foreground-muted"} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{title}</span>
          {badge}
        </div>
        <p className="mt-0.5 line-clamp-1 text-sm text-foreground-muted">
          {detail}
        </p>
      </div>
      <span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-primary group-hover:flex sm:flex">
        {cta} <ArrowRight className="size-3.5" />
      </span>
    </Link>
  );
}

/** A right-rail section that grows with its content (no nested scroll). */
function RailSection({
  title,
  icon: Icon,
  href,
  count,
  empty,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Icon className="size-4 text-foreground-muted" />
        <h2 className="text-sm font-semibold">{title}</h2>
        {count > 0 && (
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-foreground-muted">
            {count}
          </span>
        )}
        {href && (
          <Link
            href={href}
            className="ml-auto text-xs font-medium text-primary hover:underline"
          >
            View all
          </Link>
        )}
      </div>
      {count === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-foreground-muted">
          {empty}
        </p>
      ) : (
        <div className="divide-y divide-border">{children}</div>
      )}
    </Card>
  );
}

export default async function DashboardPage() {
  const d = await getDashboardData();

  // The priority work queue: the single ranked feed of what to act on now.
  // Order = most time-critical first (urgent → replies → voice → AI ideas).
  const hasQueue =
    d.urgentMessages.length > 0 ||
    d.pendingReplies.length > 0 ||
    d.newVoiceNotes.length > 0 ||
    d.suggestedActions.length > 0;

  return (
    <>
      <PageHeader
        title={`Good day, ${d.agent.name.split(" ")[0]}`}
        description="Your command center — everything that needs a decision, in one queue."
      />

      {/* Clickable stat strip — each jumps to its surface. */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Urgent"
          value={d.counts.urgent}
          accent="urgent"
          href="/inbox"
        />
        <StatCard
          label="Pending replies"
          value={d.counts.pending}
          href="/inbox"
        />
        <StatCard
          label="AI suggestions"
          value={d.counts.actions}
          href="/dashboard"
        />
        <StatCard
          label="Voice notes"
          value={d.counts.voice}
          href="/inbox"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Priority work queue — the main column. */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Sparkles className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Priority queue</h2>
            </div>

            {!hasQueue ? (
              <p className="px-4 py-12 text-center text-sm text-foreground-muted">
                You&apos;re all caught up — nothing needs action right now.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {d.urgentMessages.map((c) => (
                  <QueueItem
                    key={`urgent-${c.id}`}
                    href="/inbox"
                    icon={AlertTriangle}
                    iconClass="size-4 text-urgency-5"
                    title={convName(c)}
                    detail={
                      c.summary ??
                      humanizeEnum(c.classification ?? "new_enquiry")
                    }
                    badge={<UrgencyBadge level={c.urgency} />}
                    cta="Open chat"
                  />
                ))}

                {d.pendingReplies.map((c) => (
                  <QueueItem
                    key={`reply-${c.id}`}
                    href="/inbox"
                    icon={Reply}
                    iconClass="size-4 text-primary"
                    title={convName(c)}
                    detail={c.summary ?? "Awaiting your reply"}
                    badge={
                      c.lastMessageAt ? (
                        <span className="shrink-0 text-xs text-foreground-muted">
                          {formatRelativeTime(c.lastMessageAt)}
                        </span>
                      ) : undefined
                    }
                    cta="Reply"
                  />
                ))}

                {d.newVoiceNotes.map((m) => (
                  <QueueItem
                    key={`voice-${m.id}`}
                    href="/inbox"
                    icon={Mic}
                    iconClass="size-4 text-primary"
                    title={
                      m.conversation.client?.name ??
                      m.conversation.contactName ??
                      m.conversation.contactPhone
                    }
                    detail={
                      m.transcription
                        ? `“${m.transcription}”`
                        : "Voice note — awaiting transcription"
                    }
                    cta="Review"
                  />
                ))}

                {d.suggestedActions.map((a) => (
                  <QueueItem
                    key={`action-${a.id}`}
                    href={a.client ? `/clients/${a.client.id}` : "/dashboard"}
                    icon={Sparkles}
                    iconClass="size-4 text-primary"
                    title={a.label}
                    detail={a.reason ?? "AI-suggested next step"}
                    cta="Act"
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right rail — schedule and alerts. */}
        <div className="space-y-4">
          <RailSection
            title="Today"
            icon={CalendarClock}
            href="/calendar"
            count={d.todaysViewings.length + d.todaysMeetings.length}
            empty="Nothing scheduled today."
          >
            {d.todaysViewings.map((e) => (
              <Link
                key={e.id}
                href="/calendar"
                className="flex items-start gap-3 px-4 py-3 hover:bg-surface-muted/50"
              >
                <span className="mt-0.5 inline-flex items-center gap-1 rounded-md bg-primary-muted px-2 py-0.5 text-xs font-semibold text-primary">
                  <Eye className="size-3" />
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
              </Link>
            ))}
            {d.todaysMeetings.map((e) => (
              <Link
                key={e.id}
                href="/calendar"
                className="flex items-start gap-3 px-4 py-3 hover:bg-surface-muted/50"
              >
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
              </Link>
            ))}
          </RailSection>

          <RailSection
            title="Deals to nudge"
            icon={Handshake}
            href="/opportunities"
            count={d.dealsNeedingAttention.length}
            empty="No active deals right now."
          >
            {d.dealsNeedingAttention.map((deal) => (
              <Link
                key={deal.id}
                href={`/pipeline?type=${deal.type}`}
                className="flex items-start gap-3 px-4 py-3 hover:bg-surface-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
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
              </Link>
            ))}
          </RailSection>

          <RailSection
            title="Document alerts"
            icon={FileWarning}
            href="/documents"
            count={d.dealsAwaitingDocs.length + d.expiringDocuments.length}
            empty="No document gaps or expiries."
          >
            {d.dealsAwaitingDocs.map((deal) => (
              <div
                key={`deal-${deal.id}`}
                className="flex items-start gap-3 px-4 py-3"
              >
                <FileWarning className="mt-0.5 size-4 shrink-0 text-urgency-3" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {deal.client?.name ?? "Unassigned"}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    Documents requested — outstanding
                  </p>
                </div>
              </div>
            ))}
            {d.expiringDocuments.map((doc) => (
              <Link
                key={`doc-${doc.id}`}
                href="/documents"
                className="flex items-start gap-3 px-4 py-3 hover:bg-surface-muted/50"
              >
                <Clock className="mt-0.5 size-4 shrink-0 text-urgency-4" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.name}</p>
                  <p className="text-xs text-foreground-muted">
                    Expires — {doc.expiresAt?.toLocaleDateString("en-GB")}
                  </p>
                </div>
              </Link>
            ))}
          </RailSection>
        </div>
      </div>
    </>
  );
}
