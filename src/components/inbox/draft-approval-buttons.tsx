"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, X, Loader2 } from "lucide-react";
import { approveDraft, discardDraft } from "@/server/message-actions";

export function DraftApprovalButtons({ messageId }: { messageId: string }) {
  const router = useRouter();
  const [isApproving, startApprove] = useTransition();
  const [isDiscarding, startDiscard] = useTransition();

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        onClick={() =>
          startApprove(async () => {
            await approveDraft(messageId);
            router.refresh();
          })
        }
        disabled={isApproving || isDiscarding}
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
      >
        {isApproving ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
        Approve & send
      </button>
      <button
        onClick={() =>
          startDiscard(async () => {
            await discardDraft(messageId);
            router.refresh();
          })
        }
        disabled={isApproving || isDiscarding}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted disabled:opacity-60"
      >
        <X className="size-3.5" /> Discard
      </button>
    </div>
  );
}
