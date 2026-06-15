"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAgent } from "@/server/agent";
import { ingestInbound } from "@/server/whatsapp-ingest";

// Sample inbound WhatsApp messages for demoing the Chunk 12 pipeline without
// real Meta credentials. Each call injects one as if it arrived via webhook,
// running the same ingest → AI analysis → auto-reply path.
const SAMPLES: { from: string; name: string; text: string }[] = [
  { from: "+971555100201", name: "Layla Ahmed", text: "Hi! I'm relocating to Dubai next month and need a 2-bedroom in Dubai Marina, budget around 180k a year. Can you help?" },
  { from: "+971555100202", name: "Tom Becker", text: "Do you have any 3 bedroom villas on the Palm? Cash buyer, ready to move fast — keen to view this week." },
  { from: "+971555100203", name: "Aisha Noor", text: "Is the Downtown apartment still available? What documents do I need to rent it?" },
  { from: "+971555100204", name: "Daniel Okafor", text: "Looking to invest in a studio in JLT under 700k. What's the expected rental yield?" },
  { from: "+971555100205", name: "Mei Lin", text: "Can you do better on the price for the Business Bay 1 bedroom? I can pay cash." },
  { from: "+971555100206", name: "Carlos Ruiz", text: "Hello, I'd like to book a viewing for the Marina apartment tomorrow afternoon if possible." },
];

/** Inject a sample inbound WhatsApp message (demo). Returns the conversation id. */
export async function simulateInbound() {
  const agent = await getCurrentAgent();
  const sample = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];

  const conversationId = await ingestInbound(agent.id, {
    externalId: `sim-${Date.now()}`,
    from: sample.from,
    name: sample.name,
    type: "text",
    text: sample.text,
    mediaId: null,
  });

  revalidatePath("/inbox");
  revalidatePath("/dashboard");
  return conversationId;
}
