"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteDocument } from "@/server/document-actions";

export function DeleteDocButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() => {
        if (confirm("Delete this document?"))
          startTransition(async () => deleteDocument(id));
      }}
      disabled={isPending}
      className="rounded-md p-1.5 text-foreground-muted hover:bg-urgency-5/10 hover:text-urgency-5 disabled:opacity-50"
      aria-label="Delete document"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
