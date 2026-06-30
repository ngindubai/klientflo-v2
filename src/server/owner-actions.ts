"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import { parseOwnerCsv } from "@/lib/owners-csv";
import { sendText, isWhatsAppConfigured } from "@/server/whatsapp";
import { generateOutreachMessage } from "@/server/ai/outreach";

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

/** Update the free-text note on a single owner. */
export async function updateOwnerNote(id: string, notes: string) {
  const agent = await getCurrentAgent();
  const owner = await prisma.owner.findFirst({
    where: { id, agentId: agent.id },
    select: { id: true },
  });
  if (!owner) throw new Error("Owner not found.");
  await prisma.owner.update({
    where: { id },
    data: { notes: notes.trim() || null },
  });
  revalidatePath("/owners");
}

export type OwnerSendResult = { sent: number; failed: number; demo: boolean };

/**
 * Send a WhatsApp message to one or more owners from inside the app. Each send
 * upserts a conversation by the owner's phone (so it appears in the inbox) and
 * records the outbound message. Throttled; mocked in demo mode.
 */
export async function sendOwnerMessages(
  ownerIds: string[],
  message: string,
): Promise<OwnerSendResult> {
  const agent = await getCurrentAgent();
  const text = message.trim();
  if (!text) throw new Error("Message is empty.");
  if (!ownerIds.length) throw new Error("Select at least one owner.");

  const owners = await prisma.owner.findMany({
    where: { id: { in: ownerIds }, agentId: agent.id },
    select: { id: true, name: true, phone: true },
  });

  let sent = 0;
  let failed = 0;
  for (const o of owners) {
    if (!o.phone) {
      failed++;
      continue;
    }
    try {
      const conv = await prisma.conversation.upsert({
        where: { agentId_contactPhone: { agentId: agent.id, contactPhone: o.phone } },
        create: { agentId: agent.id, contactPhone: o.phone, contactName: o.name },
        update: { lastMessageAt: new Date() },
        select: { id: true },
      });
      const res = await sendText(o.phone, text);
      await prisma.message.create({
        data: {
          agentId: agent.id,
          conversationId: conv.id,
          direction: "outbound",
          type: "text",
          status: "sent",
          body: text,
          externalId: res.externalId,
        },
      });
      sent++;
    } catch {
      failed++;
    }
    await new Promise((r) => setTimeout(r, 120));
  }

  revalidatePath("/owners");
  revalidatePath("/inbox");
  return { sent, failed, demo: !isWhatsAppConfigured() };
}

/** AI-draft an owner-outreach message from a short brief. */
export async function draftOwnerMessage(brief: string): Promise<string> {
  await getCurrentAgent();
  return generateOutreachMessage(brief);
}

/** Delete all imported owners (lets the agent re-import a corrected file). */
export async function clearOwners() {
  const agent = await getCurrentAgent();
  await prisma.owner.deleteMany({ where: { agentId: agent.id } });
  revalidatePath("/owners");
}
