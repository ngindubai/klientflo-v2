"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import { parseOwnerCsv } from "@/lib/owners-csv";

export type ImportResult = {
  imported: number;
  skipped: number;
  total: number;
  unmappedHeaders: string[];
  error?: string;
};

/**
 * Import owners from a pasted/uploaded CSV. Parsing + column mapping + dedupe
 * live in the pure, unit-tested parseOwnerCsv (src/lib/owners-csv.ts); here we
 * just persist the resulting records.
 */
export async function importOwnersCsv(csvText: string): Promise<ImportResult> {
  const agent = await getCurrentAgent();
  const parsed = parseOwnerCsv(csvText);
  if (parsed.error) {
    return {
      imported: 0,
      skipped: parsed.skipped,
      total: parsed.total,
      unmappedHeaders: parsed.unmappedHeaders,
      error: parsed.error,
    };
  }

  if (parsed.records.length > 0) {
    await prisma.owner.createMany({
      data: parsed.records.map((r) => ({
        ...r,
        agentId: agent.id,
        source: "import",
      })),
    });
  }

  revalidatePath("/owners");
  return {
    imported: parsed.records.length,
    skipped: parsed.skipped,
    total: parsed.total,
    unmappedHeaders: parsed.unmappedHeaders,
  };
}

/** Delete all imported owners (lets the agent re-import a corrected file). */
export async function clearOwners() {
  const agent = await getCurrentAgent();
  await prisma.owner.deleteMany({ where: { agentId: agent.id } });
  revalidatePath("/owners");
}
