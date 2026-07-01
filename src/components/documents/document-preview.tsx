"use client";

import { useState } from "react";
import { Eye, X, ExternalLink } from "lucide-react";

/**
 * Preview a document inside the app (modal with an inline iframe) instead of
 * navigating away. Works for the app-served files (/api/files/[id]) and any
 * embeddable URL; an "Open in new tab" fallback is always available.
 */
export function DocPreviewButton({
  name,
  fileUrl,
}: {
  name: string;
  fileUrl: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-md p-1.5 text-foreground-muted hover:bg-surface-muted hover:text-foreground"
        aria-label={`Preview ${name}`}
        title="Preview"
      >
        <Eye className="size-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
              <p className="truncate text-sm font-medium">{name}</p>
              <div className="flex shrink-0 items-center gap-1">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-foreground-muted hover:bg-surface-muted"
                  title="Open in new tab"
                >
                  <ExternalLink className="size-3.5" /> Open
                </a>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1 text-foreground-muted hover:bg-surface-muted"
                  aria-label="Close preview"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <iframe
              src={fileUrl}
              title={name}
              className="min-h-0 flex-1 bg-surface-muted"
            />
          </div>
        </div>
      )}
    </>
  );
}
