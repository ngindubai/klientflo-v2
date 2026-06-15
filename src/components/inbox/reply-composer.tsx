"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { sendReply, suggestReply } from "@/server/message-actions";

export function ReplyComposer({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [isSending, startSend] = useTransition();
  const [isSuggesting, startSuggest] = useTransition();

  function send() {
    const body = text.trim();
    if (!body) return;
    startSend(async () => {
      await sendReply(conversationId, body);
      setText("");
      router.refresh();
    });
  }

  return (
    <div className="border-t border-border p-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
        }}
        rows={2}
        placeholder="Type a reply…  (⌘/Ctrl + Enter to send)"
        className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          onClick={() =>
            startSuggest(async () => setText(await suggestReply(conversationId)))
          }
          disabled={isSuggesting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted disabled:opacity-60"
        >
          {isSuggesting ? (
            <Loader2 className="size-3.5 animate-spin text-primary" />
          ) : (
            <Sparkles className="size-3.5 text-primary" />
          )}
          Suggest reply
        </button>
        <button
          onClick={send}
          disabled={!text.trim() || isSending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
        >
          {isSending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Send
        </button>
      </div>
    </div>
  );
}
