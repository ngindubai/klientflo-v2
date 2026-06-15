"use server";

import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import { runScrape, getScrapeJob } from "@/server/scrape";

export type ScrapeStatus = {
  id: string;
  status: string;
  progress: number;
  imported: number;
  message: string | null;
};

/** Start a property-source scrape in the background; returns the job to poll. */
export async function startScrape(): Promise<ScrapeStatus> {
  const agent = await getCurrentAgent();

  // Reuse an in-flight job rather than starting a second.
  const running = await prisma.scrapeJob.findFirst({
    where: { agentId: agent.id, status: "running" },
  });
  if (running) return toStatus(running);

  const job = await prisma.scrapeJob.create({
    data: { agentId: agent.id, status: "running", progress: 0, message: "Starting…" },
  });

  // Fire-and-forget: the Node process keeps running the loop after we return.
  void runScrape(job.id, agent.id);
  return toStatus(job);
}

/** Poll a scrape job's current status. */
export async function pollScrape(jobId: string): Promise<ScrapeStatus | null> {
  const job = await getScrapeJob(jobId);
  return job ? toStatus(job) : null;
}

function toStatus(j: {
  id: string;
  status: string;
  progress: number;
  imported: number;
  message: string | null;
}): ScrapeStatus {
  return {
    id: j.id,
    status: j.status,
    progress: j.progress,
    imported: j.imported,
    message: j.message,
  };
}
