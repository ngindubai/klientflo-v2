import Link from "next/link";
import { UrgencyBadge } from "@/components/dashboard/urgency-badge";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  CONTACT_CATEGORY_CHIP,
  CONTACT_CATEGORY_LABELS,
  type ContactCategory,
} from "@/lib/constants";

type ConversationRow = {
  id: string;
  contactName: string | null;
  contactPhone: string;
  urgency: number;
  awaitingReply: boolean;
  lastMessageAt: Date | null;
  client: { name: string; category: ContactCategory } | null;
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
                <span className="flex shrink-0 items-center gap-1">
                  {c.client && (
                    <span
                      className={cn(
                        "rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                        CONTACT_CATEGORY_CHIP[c.client.category],
                      )}
                    >
                      {CONTACT_CATEGORY_LABELS[c.client.category]}
                    </span>
                  )}
                  {c.urgency >= 4 && <UrgencyBadge level={c.urgency} />}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
