import Link from "next/link";
import { Mic, ArrowLeft } from "lucide-react";
import { UrgencyBadge } from "@/components/dashboard/urgency-badge";
import { VoiceReviewButton } from "@/components/inbox/voice-review-button";
import { ReplyComposer } from "@/components/inbox/reply-composer";
import { formatTime } from "@/lib/utils";
import { humanizeEnum } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  direction: "inbound" | "outbound";
  type: string;
  body: string | null;
  transcription: string | null;
  reviewed: boolean;
  status: string;
  createdAt: Date;
};

type Conversation = {
  id: string;
  contactName: string | null;
  contactPhone: string;
  classification: string | null;
  urgency: number;
  summary: string | null;
  client: { id: string; name: string } | null;
  messages: Message[];
};

export function MessageThread({ conversation }: { conversation: Conversation }) {
  const name =
    conversation.client?.name ?? conversation.contactName ?? conversation.contactPhone;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-border p-3">
        <div className="flex items-start gap-2">
          <Link
            href="/inbox"
            className="rounded-md p-1 text-foreground-muted hover:bg-surface-muted lg:hidden"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{name}</span>
              {conversation.urgency >= 3 && (
                <UrgencyBadge level={conversation.urgency} />
              )}
            </div>
            <p className="text-xs text-foreground-muted">
              {conversation.contactPhone}
              {conversation.classification
                ? ` · ${humanizeEnum(conversation.classification)}`
                : ""}
            </p>
          </div>
        </div>
        {conversation.client && (
          <Link
            href={`/clients/${conversation.client.id}`}
            className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
          >
            View client
          </Link>
        )}
      </div>

      {conversation.summary && (
        <p className="border-b border-border bg-primary-muted/40 px-3 py-2 text-xs text-foreground-muted">
          <span className="font-medium text-primary">AI summary: </span>
          {conversation.summary}
        </p>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {conversation.messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex",
              m.direction === "outbound" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                m.direction === "outbound"
                  ? "rounded-br-sm bg-primary text-primary-foreground"
                  : "rounded-bl-sm bg-surface-muted text-foreground",
              )}
            >
              {m.type === "voice" ? (
                <div>
                  <span className="flex items-center gap-1 text-xs font-medium opacity-80">
                    <Mic className="size-3" /> Voice note
                  </span>
                  <p className="mt-1 italic">
                    {m.transcription ?? "Awaiting transcription (Chunk 13)"}
                  </p>
                  {m.direction === "inbound" && !m.reviewed && (
                    <VoiceReviewButton messageId={m.id} />
                  )}
                </div>
              ) : m.type === "image" ? (
                <p>📷 Photo{m.body ? ` — ${m.body}` : ""}</p>
              ) : m.type === "document" || m.type === "pdf" ? (
                <p>📄 Document{m.body ? ` — ${m.body}` : ""}</p>
              ) : (
                <p className="whitespace-pre-wrap">{m.body}</p>
              )}
              <span
                className={cn(
                  "mt-1 block text-right text-[10px]",
                  m.direction === "outbound"
                    ? "text-primary-foreground/70"
                    : "text-foreground-muted",
                )}
              >
                {formatTime(m.createdAt)}
                {m.direction === "outbound" && m.status === "failed" && " · failed"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <ReplyComposer conversationId={conversation.id} />
    </div>
  );
}
