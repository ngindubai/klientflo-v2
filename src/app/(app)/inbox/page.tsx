import { MessageSquare } from "lucide-react";
import { ConversationList } from "@/components/inbox/conversation-list";
import { MessageThread } from "@/components/inbox/message-thread";
import { Card } from "@/components/ui/card";
import { getConversations, getConversation } from "@/server/inbox";
import { isWhatsAppConfigured } from "@/server/whatsapp";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const [conversations, active] = await Promise.all([
    getConversations(),
    c ? getConversation(c) : Promise.resolve(null),
  ]);

  return (
    <div className="flex h-[calc(100dvh-7rem)] flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">WhatsApp Inbox</h1>
        {!isWhatsAppConfigured() && (
          <span className="rounded-full bg-surface-muted px-3 py-1 text-xs text-foreground-muted">
            Demo mode — connect WhatsApp in Settings to go live
          </span>
        )}
      </div>

      <Card className="grid flex-1 grid-cols-1 overflow-hidden p-0 lg:grid-cols-[340px_1fr]">
        {/* Conversation list */}
        <div
          className={cn(
            "flex-col border-r border-border lg:flex",
            active ? "hidden" : "flex",
          )}
        >
          {conversations.length === 0 ? (
            <p className="p-6 text-center text-sm text-foreground-muted">
              No conversations yet.
            </p>
          ) : (
            <ConversationList conversations={conversations} activeId={c} />
          )}
        </div>

        {/* Thread */}
        <div className={cn("min-w-0", active ? "block" : "hidden lg:block")}>
          {active ? (
            <MessageThread conversation={active} />
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
