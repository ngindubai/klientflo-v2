import Link from "next/link";
import { Mic, ArrowLeft } from "lucide-react";
import { UrgencyBadge } from "@/components/dashboard/urgency-badge";
import { VoiceReviewButton } from "@/components/inbox/voice-review-button";
import { TranscribeButton } from "@/components/inbox/transcribe-button";
import { DraftApprovalButtons } from "@/components/inbox/draft-approval-buttons";
import { ReplyComposer } from "@/components/inbox/reply-composer";
import { TagSelector } from "@/components/inbox/tag-selector";
import { TagSuggestion } from "@/components/inbox/tag-suggestion";
import { SendPackButton } from "@/components/inbox/send-pack-button";
import { formatTime } from "@/lib/utils";
import { humanizeEnum, type ContactCategory } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  direction: "inbound" | "outbound";
  type: string;
  body: string | null;
  transcription: string | null;
  reviewed: boolean;
  status: string;
  aiGenerated: boolean;
  createdAt: Date;
};

type Conversation = {
  id: string;
  contactName: string | null;
  contactPhone: string;
  classification: string | null;
  urgency: number;
  summary: string | null;
  categorySuggested: ContactCategory | null;
  client: { id: string; name: string; category: ContactCategory } | null;
  messages: Message[];
};

export function MessageThread({
  conversation,
  templates,
  properties,
}: {
  conversation: Conversation;
  templates: { id: string; name: string }[];
  properties: { id: string; title: string }[];
}) {
  const name =
    conversation.client?.name ?? conversation.contactName ?? conversation.contactPhone;

  // Show the AI tag suggestion only when it differs from the current tag.
  const currentCategory = conversation.client?.category ?? null;
  const showSuggestion =
    conversation.categorySuggested != null &&
    conversation.categorySuggested !== currentCategory;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border p-3">
        <div className="flex min-w-0 items-start gap-2">
          <Link
            href="/inbox"
            className="rounded-md p-1 text-foreground-muted hover:bg-surface-muted lg:hidden"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold">{name}</span>
              {conversation.urgency >= 3 && (
                <UrgencyBadge level={conversation.urgency} />
              )}
            </div>
            <p className="truncate text-xs text-foreground-muted">
              {conversation.contactPhone}
              {conversation.classification
                ? ` · ${humanizeEnum(conversation.classification)}`
                : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SendPackButton
            conversationId={conversation.id}
            templates={templates}
            properties={properties}
          />
          <TagSelector
            conversationId={conversation.id}
            category={conversation.client?.category ?? null}
          />
          {conversation.client && (
            <Link
              href={`/clients/${conversation.client.id}`}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
            >
              View client
            </Link>
          )}
        </div>
      </div>

      {showSuggestion && conversation.categorySuggested && (
        <TagSuggestion
          conversationId={conversation.id}
          suggested={conversation.categorySuggested}
        />
      )}

      {conversation.summary && (
        <p className="border-b border-border bg-primary-muted/40 px-3 py-2 text-xs text-foreground-muted">
          <span className="font-medium text-primary">AI summary: </span>
          {conversation.summary}
        </p>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {conversation.messages.map((m) => {
          // Pending AI-drafted replies render as an approval card, not a bubble.
          if (m.direction === "outbound" && m.status === "pending" && m.aiGenerated) {
            return (
              <div
                key={m.id}
                className="rounded-[var(--radius-card)] border border-dashed border-primary/40 bg-primary-muted/30 p-3"
              >
                <p className="mb-1 flex items-center gap-1 text-xs font-medium text-primary">
                  ✨ AI draft — pending your approval
                </p>
                <p className="whitespace-pre-wrap text-sm">{m.body}</p>
                <DraftApprovalButtons messageId={m.id} />
              </div>
            );
          }
          return (
          <div
            key={m.id}
            className={cn(
              "flex",
              m.direction === "outbound" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[80%] overflow-hidden rounded-2xl px-3 py-2 text-sm break-words [overflow-wrap:anywhere]",
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
                  {m.transcription ? (
                    <p className="mt-1 italic">{m.transcription}</p>
                  ) : (
                    <p className="mt-1 italic opacity-70">Not transcribed yet</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    {m.direction === "inbound" && !m.transcription && (
                      <TranscribeButton messageId={m.id} />
                    )}
                    {m.direction === "inbound" && !m.reviewed && (
                      <VoiceReviewButton messageId={m.id} />
                    )}
                  </div>
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
          );
        })}
      </div>

      <ReplyComposer conversationId={conversation.id} />
    </div>
  );
}
