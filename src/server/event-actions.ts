"use server";

import { parseDubaiDateTime, validateEventTimes, WORKSPACE_TIME_ZONE } from "@/lib/dubai-time";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import { humanizeEnum, EVENT_TYPES, type EventType } from "@/lib/constants";

export type EventInput = {
  type: string;
  title: string;
  startsAt: string; // datetime-local
  endsAt?: string;
  location?: string;
  notes?: string;
  clientId?: string;
  propertyId?: string;
  dealId?: string;
};

const DEFAULT_DURATION: Record<string, number> = {
  viewing: 30,
  follow_up: 15,
  office_meeting: 60,
  trustee_office_meeting: 60,
  contract_signing: 60,
  handover: 60,
};

const clean = (v?: string) => {
  const t = v?.trim();
  return t ? t : null;
};

function buildData(input: EventInput) {
  const type = (EVENT_TYPES as readonly string[]).includes(input.type)
    ? (input.type as EventType)
    : "viewing";
  const startsAt = parseDubaiDateTime(input.startsAt);
  if (Number.isNaN(startsAt.getTime())) throw new Error("Invalid start time.");
  const endsAt = input.endsAt?.trim()
    ? parseDubaiDateTime(input.endsAt)
    : new Date(startsAt.getTime() + (DEFAULT_DURATION[type] ?? 60) * 60_000);

  validateEventTimes(startsAt, endsAt);
  if (!input.title.trim()) throw new Error("A title is required.");
  return {
    type,
    title: input.title.trim(),
    startsAt,
    endsAt,
    location: clean(input.location),
    notes: clean(input.notes),
    clientId: clean(input.clientId),
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
  };
}

export async function createEvent(input: EventInput) {
  const agent = await getCurrentAgent();
  if (!input.title?.trim() || !input.startsAt) {
    throw new Error("Title and start time are required.");
  }
  if (input.dealId && !await prisma.deal.findFirst({ where: { id: input.dealId, agentId: agent.id } })) throw new Error("Deal not found.");
  await prisma.event.create({ data: { agentId: agent.id, ...buildData(input) } });
  revalidatePath("/calendar");
  if (input.dealId) { revalidatePath(`/deals/${input.dealId}`); redirect(`/deals/${input.dealId}`); }
  redirect("/calendar");
}

export async function updateEvent(id: string, input: EventInput) {
  const agent = await getCurrentAgent();
  const existing = await prisma.event.findFirst({
    where: { id, agentId: agent.id },
  });
  if (!existing) throw new Error("Event not found.");
  if (input.dealId && !await prisma.deal.findFirst({ where: { id: input.dealId, agentId: agent.id } })) throw new Error("Deal not found.");
  const data = buildData({ ...input, dealId: existing.dealId ?? input.dealId });
  await prisma.event.update({ where: { id }, data });
  revalidatePath("/calendar");
  if (data.dealId) { revalidatePath(`/deals/${data.dealId}`); redirect(`/deals/${data.dealId}`); }
  redirect("/calendar");
}

export async function deleteEvent(id: string) {
  const agent = await getCurrentAgent();
  await prisma.event.deleteMany({ where: { id, agentId: agent.id } });
  revalidatePath("/calendar");
  redirect("/calendar");
}

/** Build a WhatsApp-ready invite message for an event (sending lands in Chunk 12). */
export async function generateEventInvite(id: string): Promise<string> {
  const agent = await getCurrentAgent();
  const event = await prisma.event.findFirst({
    where: { id, agentId: agent.id },
    include: { client: true, property: true },
  });
  if (!event) throw new Error("Event not found.");

  const date = event.startsAt.toLocaleDateString("en-GB", {
    timeZone: WORKSPACE_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const time = event.startsAt.toLocaleTimeString("en-GB", {
    timeZone: WORKSPACE_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });

  const lines = [
    `Hi${event.client ? ` ${event.client.name.split(" ")[0]}` : ""},`,
    "",
    `Confirming your ${humanizeEnum(event.type).toLowerCase()} on ${date} at ${time} (Dubai time).`,
  ];
  if (event.property) lines.push(`Property: ${event.property.title}`);
  if (event.location) lines.push(`Location: ${event.location}`);
  lines.push("", "Looking forward to seeing you!", `— ${agent.name}`);
  return lines.join("\n");
}
