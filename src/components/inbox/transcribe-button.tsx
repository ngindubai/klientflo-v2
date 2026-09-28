"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileAudio, Loader2 } from "lucide-react";
import { transcribeVoiceNote } from "@/server/voice-actions";

export function TranscribeButton({ messageId }: { messageId: string }) {
  const [error, setError] = useState("");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <span><button
      onClick={() =>
        startTransition(async () => {
          setError("");
          try { const result = await transcribeVoiceNote(messageId); if (result.error) setError(result.error); else router.refresh(); } catch (err) { setError(err instanceof Error ? err.message : "Transcription unavailable. Please try again."); }
        })
      }
      disabled={isPending}
      className="mt-1 inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-xs font-medium hover:bg-surface-muted disabled:opacity-60"
    >
      {isPending ? <Loader2 className="size-3 animate-spin" /> : <FileAudio className="size-3" />}
      Transcribe
    </button>{error && <span role="status" className="mt-1 block text-xs">{error}</span>}</span>
  );
}
