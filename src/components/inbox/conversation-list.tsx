import Link from "next/link";
import { formatRelativeTime, cn } from "@/lib/utils";
import { CONTACT_CATEGORY_CHIP, CONTACT_CATEGORY_LABELS, type ContactCategory } from "@/lib/constants";
import { conversationPriority, PRIORITY_STYLES, PRIORITY_LABELS } from "@/lib/conversation-priority";
type ConversationRow = { id: string; contactName: string | null; contactPhone: string; classification: string | null; urgency: number; awaitingReply: boolean; lastMessageAt: Date | null; client: { name: string; category: ContactCategory } | null; messages: { body: string | null; transcription: string | null; type: string; status: string }[] };
function preview(m?: ConversationRow["messages"][number]) {
  if (!m) return "No messages yet";
  const prefix = m.status === "failed" ? "Not sent · " : "";
  if (m.type === "voice") return `${prefix}Voice note · ${m.transcription ?? "Awaiting transcription"}`;
  if (["document", "pdf", "image"].includes(m.type)) return `${prefix}${m.type === "image" ? "Photo" : "Document"} · ${m.body ?? ""}`;
  return prefix + (m.body ?? "");
}
export function ConversationList({ conversations, activeId, query = {} }: { conversations: ConversationRow[]; activeId?: string; query?: Record<string, string> }) {
  return <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto overscroll-contain" aria-label="Conversations ranked by selected sort">
    {conversations.map(c => {
      const priority = conversationPriority(c);
      return <li key={c.id}><Link href={`/inbox?${new URLSearchParams({ ...query, c: c.id })}`} aria-current={c.id === activeId ? "page" : undefined} className={cn("kf-conversation-row block border-l-2 border-transparent px-3 py-2.5 transition-colors hover:bg-surface-muted", c.id === activeId && "border-l-primary bg-primary-muted/50")}>
        <div className="flex items-center gap-1.5">{c.awaitingReply && <span className="size-1.5 shrink-0 rounded-full bg-primary" title="Needs a reply" />}<span className="min-w-0 flex-1 truncate text-sm font-semibold">{c.client?.name ?? c.contactName ?? c.contactPhone}</span>{c.lastMessageAt && <span className="shrink-0 text-[10px] text-foreground-muted">{formatRelativeTime(c.lastMessageAt)}</span>}</div>
        <div className="my-1 flex min-w-0 items-center gap-1"><span title={`${PRIORITY_LABELS[priority.level]} priority: ${priority.reason}`} className={cn("truncate rounded border px-1.5 py-0.5 text-[10px] font-semibold", PRIORITY_STYLES[priority.level])}>{PRIORITY_LABELS[priority.level]} · {priority.reason}</span><span className={cn("shrink-0 rounded border px-1.5 py-0.5 text-[10px]", c.client ? CONTACT_CATEGORY_CHIP[c.client.category] : "border-border text-foreground-muted")}>{c.client ? CONTACT_CATEGORY_LABELS[c.client.category] : "Untagged"}</span></div>
        <p className="truncate text-xs text-foreground-muted">{preview(c.messages[0])}</p>
      </Link></li>;
    })}
  </ul>;
}
