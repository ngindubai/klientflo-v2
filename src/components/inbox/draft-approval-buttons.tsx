"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, X, Loader2 } from "lucide-react";
import { approveDraft, discardDraft } from "@/server/message-actions";

export function DraftApprovalButtons({ messageId, demo }: { messageId: string; demo: boolean }) {
  const [error, setError] = useState("");
  const router = useRouter();
  const [isApproving, startApprove] = useTransition();
  const [isDiscarding, startDiscard] = useTransition();

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button
        onClick={() =>
          startApprove(async () => {
            try { const r = await approveDraft(messageId); if(r.status === "failed") setError("Reply failed. Copy the draft below into the reply box to retry."); router.refresh(); } catch { setError("Could not approve this draft. Please try again."); }
          })
        }
        disabled={isApproving || isDiscarding}
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
      >
        {isApproving ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
        {demo ? "Approve demo reply" : "Approve & send"}
      </button>
      <button
        onClick={() =>
          startDiscard(async () => {
            try { await discardDraft(messageId); router.refresh(); } catch { setError("Could not discard this draft. Please try again."); }
          })
        }
        disabled={isApproving || isDiscarding}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted disabled:opacity-60"
      >
        <X className="size-3.5" /> Discard
      </button>
      {error && <p role="alert" className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
