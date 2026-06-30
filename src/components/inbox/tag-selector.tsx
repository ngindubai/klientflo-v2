"use client";

import { useTransition } from "react";
import { Tag } from "lucide-react";
import { setConversationTag } from "@/server/contact-actions";
import {
  CONTACT_CATEGORIES,
  CONTACT_CATEGORY_LABELS,
  type ContactCategory,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Tag the current conversation's contact (Client / Agent / Investor / Spam /
 * Personal). Defaults to the contact's current category, or "client" when the
 * conversation has no contact yet (selecting then creates + links one).
 */
export function TagSelector({
  conversationId,
  category,
}: {
  conversationId: string;
  category: ContactCategory | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <label
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs",
        pending && "opacity-50",
      )}
      title="Tag this conversation"
    >
      <Tag className="size-3.5 text-foreground-muted" />
      <select
        className="bg-transparent text-xs font-medium outline-none"
        value={category ?? "client"}
        disabled={pending}
        onChange={(e) =>
          startTransition(() =>
            setConversationTag(
              conversationId,
              e.target.value as ContactCategory,
            ),
          )
        }
      >
        {!category && <option value="client">Tag…</option>}
        {CONTACT_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {CONTACT_CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>
    </label>
  );
}
