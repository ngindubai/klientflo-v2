"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";
import { startScrape, pollScrape, type ScrapeStatus } from "@/server/scrape-actions";

export function RefreshSources({ initial }: { initial: ScrapeStatus | null }) {
  const router = useRouter();
  const [job, setJob] = useState<ScrapeStatus | null>(initial);
  const [isStarting, startTransition] = useTransition();

  // Poll while a job is running. Resumes automatically when the page is
  // revisited mid-scrape (initial comes from the server).
  useEffect(() => {
    if (job?.status !== "running") return;
    const jobId = job.id;
    const t = setInterval(async () => {
      const next = await pollScrape(jobId);
      if (next) {
        setJob(next);
        if (next.status !== "running") {
          clearInterval(t);
          router.refresh(); // show newly imported listings
        }
      }
    }, 1500);
    return () => clearInterval(t);
  }, [job?.id, job?.status, router]);

  if (job?.status === "running") {
    return (
      <div className="w-64">
        <div className="mb-1 flex items-center justify-between text-xs text-foreground-muted">
          <span className="flex items-center gap-1">
            <Loader2 className="size-3 animate-spin text-primary" /> Scraping…
          </span>
          <span className="tabular-nums">{job.progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${job.progress}%` }}
          />
        </div>
        {job.message && (
          <p className="mt-1 truncate text-xs text-foreground-muted">{job.message}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => startTransition(async () => setJob(await startScrape()))}
        disabled={isStarting}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted disabled:opacity-60"
      >
        <RefreshCw className={isStarting ? "size-4 animate-spin" : "size-4"} />
        Refresh listings
      </button>
      {job?.status === "done" && job.message && (
        <span className="hidden text-xs text-accent sm:inline">{job.message}</span>
      )}
    </div>
  );
}
