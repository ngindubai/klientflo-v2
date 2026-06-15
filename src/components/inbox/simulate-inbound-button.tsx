"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquarePlus, Loader2 } from "lucide-react";
import { simulateInbound } from "@/server/demo-actions";

export function SimulateInboundButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() =>
        startTransition(async () => {
          const id = await simulateInbound();
          router.push(`/inbox?c=${id}`);
          router.refresh();
        })
      }
      disabled={isPending}
      title="Inject a sample inbound WhatsApp message (demo)"
      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted disabled:opacity-60"
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin text-primary" />
      ) : (
        <MessageSquarePlus className="size-3.5 text-primary" />
      )}
      Simulate inbound
    </button>
  );
}
