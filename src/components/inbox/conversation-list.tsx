import Link from "next/link";
import { UrgencyBadge } from "@/components/dashboard/urgency-badge";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

type ConversationRow = {
  id: string;
  contactName: string | null;
  contactPhone: string;
  urgency: number;
  awaitingReply: boolean;
  lastMessageAt: Date | null;
  client: { name: string } | null;
  messages: { body: string | null; transcription: string | null; type: string }[];
};

function preview(m?: ConversationRow["messages"][number]) {
  if (!m) return "No messages yet";
  if (m.type === "voice") return `🎤 ${m.transcription ?? "Voice note"}`;
  if (m.type === "image") return "📷 Photo";
  if (m.type === "document" || m.type === "pdf") return "📄 Document";
  return m.body ?? "";
}

export function ConversationList({
  conversations,
  activeId,
}: {
  conversations: ConversationRow[];
  activeId?: string;
}) {
  return (
    <ul className="divide-y divide-border overflow-y-auto">
      {conversations.map((c) => {
        const name = c.client?.name ?? c.contactName ?? c.contactPhone;
        return (
          <li key={c.id}>
            <Link
              href={`/inbox?c=${c.id}`}
              className={cn(
                "block px-3 py-3 transition-colors hover:bg-surface-muted",
                c.id === activeId && "bg-surface-muted",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 truncate font-medium">
                  {c.awaitingReply && (
                    <span className="size-2 shrink-0 rounded-full bg-accent" title="Awaiting reply" />
                  )}
                  {name}
                </span>
                {c.lastMessageAt && (
                  <span className="shrink-0 text-xs text-foreground-muted">
                    {formatRelativeTime(c.lastMessageAt)}
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <p className="line-clamp-1 text-xs text-foreground-muted">
                  {preview(c.messages[0])}
                </p>
                {c.urgency >= 4 && <UrgencyBadge level={c.urgency} />}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
