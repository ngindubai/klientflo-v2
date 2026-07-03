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
  }>;
}) {
  const { c, priority, category, tag, page } = await searchParams;
  const minUrgency = priority ? Number(priority) : undefined;
  const filters = {
    minUrgency,
    category: category || undefined,
    tag: tag || undefined,
  };
  const currentPage = Number(page) || 1;
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
    <div className="flex h-[calc(100dvh-7rem)] flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Conversations</h1>
        <div className="flex items-center gap-2">
          <SimulateInboundButton />
          {!isWhatsAppConfigured() && (
            <span className="hidden rounded-full bg-surface-muted px-3 py-1 text-xs text-foreground-muted sm:inline">
              Demo mode
            </span>
          )}
        </div>
      </div>

      <Card className="grid flex-1 grid-cols-1 overflow-hidden p-0 lg:grid-cols-[460px_1fr]">
        {/* Conversation list */}
        <div
          className={cn(
            "flex-col border-r border-border lg:flex",
            active ? "hidden" : "flex",
          )}
        >
          <InboxFilters />
          {conversations.length === 0 ? (
            <p className="p-6 text-center text-sm text-foreground-muted">
              No conversations match these filters.
            </p>
          ) : (
            <ConversationList conversations={conversations} activeId={c} />
          )}
          <div className="px-3 pb-3">
            <Pager
              page={currentPage}
              pageSize={CONVERSATIONS_PAGE_SIZE}
              total={total}
              basePath="/inbox"
              query={{
                ...(priority ? { priority } : {}),
                ...(category ? { category } : {}),
                ...(tag ? { tag } : {}),
              }}
            />
          </div>
        </div>

        {/* Thread */}
        <div className={cn("min-w-0", active ? "block" : "hidden lg:block")}>
          {active ? (
            <MessageThread
              conversation={active}
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
