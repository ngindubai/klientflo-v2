"use client";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Send, Sparkles, Loader2, Mic, Wand2 } from "lucide-react";
import { sendReply, suggestReply } from "@/server/message-actions";
import { polishMessage } from "@/server/voice-actions";
import { useSpeechRecognition } from "@/components/voice/use-speech-recognition";
import { cn } from "@/lib/utils";
export function ReplyComposer({ conversationId, demo, packAction }: { conversationId: string; demo: boolean; packAction: ReactNode }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSending, startSend] = useTransition();
  const [isSuggesting, startSuggest] = useTransition();
  const [isPolishing, startPolish] = useTransition();
  const speech = useSpeechRecognition(updateText);
  function updateText(value: string) { setText(value); try { sessionStorage.setItem(`draft:${conversationId}`, value); } catch {} }
  useEffect(() => {
    // Restore only this conversation's unsent draft when returning to its thread.
    try { const draft = sessionStorage.getItem(`draft:${conversationId}`); if (draft) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setText(draft);
    } } catch {}
  }, [conversationId]);
  const busy = isSending || isSuggesting || isPolishing;
  function send() {
    const body = text.trim(); if (!body || busy || speech.listening) return;
    startSend(async () => {
      setFeedback("");
      try {
        const result = await sendReply(conversationId, body);
        if (result.status === "failed") setFeedback("Message was not sent. Your draft is saved; try again.");
        else { updateText(""); setFeedback(result.demo ? "Demo reply saved. No message was delivered." : "Reply sent."); }
        router.refresh();
      } catch { setFeedback("Could not send. Your draft is saved; try again."); }
    });
  }
  const button = "inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-xs font-medium hover:bg-surface-muted disabled:opacity-50";
  return <div className="kf-reply border-t border-border bg-surface p-3">
    <textarea aria-label="Message reply" value={text} disabled={isSending} onChange={e => updateText(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } }} rows={2} placeholder="Write a reply, or dictate…" className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20" />
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button onClick={() => speech.supported ? speech.toggle(text) : setFeedback("Dictation needs a browser with speech recognition, such as Chrome, and microphone permission.")} disabled={busy} title="Dictate a reply" className={cn(button, speech.listening && "border-red-300 bg-red-50 text-red-700")}><Mic className="size-3.5" />{speech.listening ? "Stop dictation" : "Dictate"}</button>
      <button disabled={busy || speech.listening} className={button} onClick={() => startSuggest(async () => { try { updateText(await suggestReply(conversationId)); setFeedback(demo ? "Demo suggestion — review before sending." : ""); } catch { setFeedback("Could not suggest a reply. Please try again."); } })}>{isSuggesting ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5 text-primary" />}Suggest reply</button>
      <button disabled={busy || !text.trim() || speech.listening} className={button} onClick={() => startPolish(async () => { try { updateText(await polishMessage(text)); } catch { setFeedback("Could not polish. Your draft is unchanged."); } })}>{isPolishing ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5 text-primary" />}Polish</button>
      {packAction}
      <button onClick={send} disabled={!text.trim() || busy || speech.listening} className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}{demo ? "Demo send" : "Send"}</button>
    </div>
    {(feedback || speech.error) && <p role="status" className="mt-2 text-xs text-foreground-muted">{speech.error || feedback}</p>}
  </div>;
}
