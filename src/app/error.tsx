"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

// App-level error boundary — shows a friendly recovery screen instead of a
// blank crash, and lets the user retry or head back to the dashboard.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-urgency-5/10 text-urgency-5">
        <AlertTriangle className="size-6" />
      </span>
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="mt-1 max-w-md text-sm text-foreground-muted">
        An unexpected error occurred. You can try again, or go back to the
        dashboard.
      </p>
      <div className="mt-5 flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
