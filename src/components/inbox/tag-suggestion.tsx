"use client";

import { useTransition } from "react";
import { Sparkles } from "lucide-react";
import {
  setConversationTag,
  dismissTagSuggestion,
} from "@/server/contact-actions";
import {
  CONTACT_CATEGORY_LABELS,
  type ContactCategory,
} from "@/lib/constants";

/**
 * Inline prompt shown when Claude suggests a contact tag that differs from the
 * current one. The agent accepts (applies the tag) or dismisses it.
 */
export function TagSuggestion({
  conversationId,
  suggested,
}: {
  conversationId: string;
  suggested: ContactCategory;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between gap-2 border-b border-border bg-violet-500/10 px-3 py-2 text-xs">
      <span className="flex items-center gap-1.5 text-foreground-muted">
        <Sparkles className="size-3.5 text-violet-500" />
        AI suggests tagging this as{" "}
        <strong className="text-foreground">
          {CONTACT_CATEGORY_LABELS[suggested]}
        </strong>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        <button
          disabled={pending}
          onClick={() =>
            startTransition(() =>
              setConversationTag(conversationId, suggested),
            )
          }
          className="rounded-md bg-violet-500 px-2.5 py-1 font-medium text-white hover:bg-violet-600 disabled:opacity-50"
        >
          Accept
        </button>
        <button
          disabled={pending}
          onClick={() =>
            startTransition(() => dismissTagSuggestion(conversationId))
          }
          className="rounded-md border border-border px-2.5 py-1 font-medium hover:bg-surface-muted disabled:opacity-50"
        >
          Dismiss
        </button>
      </span>
    </div>
  );
}
