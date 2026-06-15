import { prisma } from "@/lib/db";

// A simulated portal scrape that reports progress so the UI can show a meter
// the user can leave and return to. On Render (a long-lived Node process) the
// background loop continues after the start action returns. Real Property
// Finder / Bayut imports slot in where the demo listings are created.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const SAMPLE_IMPORTS = [
  { title: "New 1BR in Dubai Hills Estate", price: 1_100_000, bedrooms: 1, bathrooms: 1, sizeSqft: 780, area: "Dubai Hills Estate", propertyType: "Apartment", source: "property_finder" as const },
  { title: "2BR in Arjan with pool view", price: 950_000, bedrooms: 2, bathrooms: 2, sizeSqft: 1150, area: "Arjan", propertyType: "Apartment", source: "bayut" as const },
  { title: "Townhouse in Damac Hills 2", price: 1_800_000, bedrooms: 3, bathrooms: 4, sizeSqft: 2100, area: "Damac Hills 2", propertyType: "Townhouse", source: "property_finder" as const },
];

export async function getLatestScrapeJob(agentId: string) {
  return prisma.scrapeJob.findFirst({
    where: { agentId },
    orderBy: { startedAt: "desc" },
  });
}

export async function getScrapeJob(id: string) {
  return prisma.scrapeJob.findUnique({ where: { id } });
}

/** Background worker — updates the job's progress as it "scrapes". */
export async function runScrape(jobId: string, agentId: string) {
  const steps = 6;
  let imported = 0;
  try {
    for (let i = 1; i <= steps; i++) {
      await sleep(2200);
      // Import a listing on alternate steps.
      if (i % 2 === 0 && SAMPLE_IMPORTS[imported]) {
        const s = SAMPLE_IMPORTS[imported];
        const listingId = `SCRAPE-${jobId.slice(-5)}-${imported}`;
        const exists = await prisma.property.findFirst({ where: { agentId, listingId } });
        if (!exists) {
          await prisma.property.create({
            data: { agentId, listingId, status: "active", images: [], floorPlans: [], ...s },
          });
        }
        imported++;
      }
      await prisma.scrapeJob.update({
        where: { id: jobId },
        data: {
          progress: Math.round((i / steps) * 100),
          imported,
          message: `Scanning portal listings — page ${i} of ${steps}…`,
        },
      });
    }

    // Expiry detection on the existing portfolio.
    await prisma.property.updateMany({
      where: { agentId, status: "active", expiresAt: { lt: new Date() } },
      data: { status: "expired" },
    });

    await prisma.scrapeJob.update({
      where: { id: jobId },
      data: {
        status: "done",
        progress: 100,
        imported,
        message: `Done — imported ${imported} new listing${imported === 1 ? "" : "s"}.`,
        finishedAt: new Date(),
      },
    });
  } catch (err) {
    console.error("[scrape] failed:", err);
    await prisma.scrapeJob
      .update({
        where: { id: jobId },
        data: { status: "failed", message: "Scrape failed — please retry.", finishedAt: new Date() },
      })
      .catch(() => {});
  }
}
