"use client";

import { Modal } from "@/components/ui/modal";
import { useState, useTransition } from "react";
import { Trash2, Send, Copy, Check, Loader2 } from "lucide-react";
import { deleteEvent, generateEventInvite } from "@/server/event-actions";

export function EventEditActions({ id }: { id: string }) {
  const [isDeleting, startDelete] = useTransition();
  const [isInviting, startInvite] = useTransition();
  const [invite, setInvite] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => startInvite(async () => setInvite(await generateEventInvite(id)))}
        disabled={isInviting}
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
      >
        {isInviting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        WhatsApp invite
      </button>

      <button
        onClick={() => {
          if (confirm("Delete this event?")) startDelete(async () => deleteEvent(id));
        }}
        disabled={isDeleting}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-urgency-5 hover:bg-urgency-5/10 disabled:opacity-60"
      >
        <Trash2 className="size-4" /> Delete
      </button>

      {invite && (
        <Modal title="WhatsApp invite" onClose={() => setInvite(null)}>
            <div className="p-4">
              <pre className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] rounded-lg bg-accent-muted p-3 font-sans text-sm">
                {invite}
              </pre>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(invite);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <span className="text-xs text-foreground-muted">
                  Copy this invite into the conversation to review and send.
                </span>
              </div>
            </div>
        </Modal>
      )}
    </div>
  );
}
