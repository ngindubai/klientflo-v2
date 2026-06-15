"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Sparkles, Loader2, Mic, Wand2 } from "lucide-react";
import { sendReply, suggestReply } from "@/server/message-actions";
import { polishMessage } from "@/server/voice-actions";
import { useSpeechRecognition } from "@/components/voice/use-speech-recognition";
import { cn } from "@/lib/utils";

export function ReplyComposer({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [isSending, startSend] = useTransition();
  const [isSuggesting, startSuggest] = useTransition();
  const [isPolishing, startPolish] = useTransition();
  const speech = useSpeechRecognition(setText);

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
        <div className="flex flex-wrap items-center gap-2">
          {speech.supported && (
            <button
              onClick={() => speech.toggle(text)}
              title="Dictate"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium",
                speech.listening
                  ? "animate-pulse border-urgency-5/30 bg-urgency-5/10 text-urgency-5"
                  : "hover:bg-surface-muted",
              )}
            >
              <Mic className="size-3.5" />
              {speech.listening ? "Listening…" : "Dictate"}
            </button>
          )}
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
            onClick={() =>
              startPolish(async () => setText(await polishMessage(text)))
            }
            disabled={isPolishing || !text.trim()}
            title="Clean up grammar and make it professional"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted disabled:opacity-60"
          >
            {isPolishing ? (
              <Loader2 className="size-3.5 animate-spin text-primary" />
            ) : (
              <Wand2 className="size-3.5 text-primary" />
            )}
            Polish
          </button>
        </div>
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
