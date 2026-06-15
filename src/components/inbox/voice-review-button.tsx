"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { markVoiceReviewed } from "@/server/message-actions";

export function VoiceReviewButton({ messageId }: { messageId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await markVoiceReviewed(messageId);
          router.refresh();
        })
      }
      disabled={isPending}
      className="mt-1 inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs font-medium hover:bg-surface-muted disabled:opacity-60"
    >
      {isPending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
      Mark reviewed
    </button>
  );
}
