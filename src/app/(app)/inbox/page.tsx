import { MessageSquare } from "lucide-react";
import { ConversationList } from "@/components/inbox/conversation-list";
import { MessageThread } from "@/components/inbox/message-thread";
import { InboxFilters } from "@/components/inbox/inbox-filters";
import { SimulateInboundButton } from "@/components/inbox/simulate-inbound-button";
import { Card } from "@/components/ui/card";
import { Pager } from "@/components/ui/pager";
import {
  getConversations,
  getConversation,
  getConversationsCount,
  CONVERSATIONS_PAGE_SIZE,
} from "@/server/inbox";
import { getTemplates } from "@/server/templates";
import { getPropertyOptions } from "@/server/properties";
import { isWhatsAppConfigured } from "@/server/whatsapp";
import { priorityLevel } from "@/lib/conversation-priority";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{
    c?: string;
    priority?: string;
    category?: string;
    tag?: string;
    page?: string;
    q?: string;
    sort?: string;
    status?: string;
  }>;
}) {
  const { c, priority, category, tag, page, q, sort, status } = await searchParams;
  const minUrgency = priority && /^[1-5]$/.test(priority) ? Number(priority) : undefined;
  const query = Object.fromEntries(Object.entries({ priority, category, tag, page, q, sort, status }).filter((entry): entry is [string, string] => Boolean(entry[1])));
  const filters = {
    minUrgency,
    priority: priorityLevel(priority),
    query: q, sort, status,
    category: category || undefined,
    tag: tag || undefined,
  };
  const currentPage = Number.isFinite(Number(page)) ? Math.max(1, Math.floor(Number(page))) : 1;
  const [conversations, total, active] = await Promise.all([
    getConversations(filters, currentPage),
    getConversationsCount(filters),
    c ? getConversation(c) : Promise.resolve(null),
  ]);
  // For the in-chat "Send pack" action (only when a thread is open).
  const [packTemplates, packProperties] = active
    ? await Promise.all([getTemplates(), getPropertyOptions()])
    : [[], []];

  return (
    <div className="kf-inbox">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-3 py-2.5 md:px-4">
        <h1 className="text-lg font-semibold tracking-tight">Conversations <span className="ml-1 text-xs font-normal text-foreground-muted">{total}</span></h1>
        <div className="flex items-center gap-2">
          <SimulateInboundButton />
          {!isWhatsAppConfigured() && (
            <span className="hidden rounded-full bg-surface-muted px-3 py-1 text-xs text-foreground-muted sm:inline">
              Demo mode
            </span>
          )}
        </div>
      </div>

      <Card className="kf-inbox-grid overflow-hidden rounded-none border-0 p-0 shadow-none">
        {/* Conversation list */}
        <div
          className={cn(
            "kf-inbox-list flex-col border-r border-border md:flex",
            active ? "hidden" : "flex",
          )}
        >
          <InboxFilters />
          {conversations.length === 0 ? (
            <p className="p-6 text-center text-sm text-foreground-muted">
              No conversations match these filters.
            </p>
          ) : (
            <ConversationList conversations={conversations} activeId={c} query={query} />
          )}
          <div className="shrink-0 px-3 pb-2">
            <Pager
              page={currentPage}
              pageSize={CONVERSATIONS_PAGE_SIZE}
              total={total}
              basePath="/inbox"
              query={query}
            />
          </div>
        </div>

        {/* Thread */}
        <div className={cn("min-h-0 min-w-0 overflow-hidden", active ? "block" : "hidden md:block")}>
          {active ? (
            <MessageThread
              key={active.id}
              conversation={active}
              backHref={`/inbox?${new URLSearchParams(query)}`}
              demo={!isWhatsAppConfigured()}
              templates={packTemplates.map((t) => ({ id: t.id, name: t.name }))}
              properties={packProperties}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-10 text-center text-foreground-muted">
              <MessageSquare className="mb-2 size-8" />
              <p className="text-sm">Select a conversation to view the thread.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
