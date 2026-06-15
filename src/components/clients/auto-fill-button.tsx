"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { autoPopulateClient } from "@/server/client-actions";

export function AutoFillButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await autoPopulateClient(id);
          router.refresh();
        })
      }
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted disabled:opacity-60"
      title="Analyse this client's WhatsApp conversations and fill in any empty requirement fields"
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin text-primary" />
      ) : (
        <Sparkles className="size-4 text-primary" />
      )}
      {isPending ? "Analysing…" : "Auto-fill from WhatsApp"}
    </button>
  );
}
