"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import { populateClientFromConversations } from "@/server/ai/populate";
import type { ClientType, PaymentMethod } from "@/lib/constants";

export type ClientInput = {
  name: string;
  phone: string;
  email?: string;
  nationality?: string;
  agencyName?: string;
  clientType?: ClientType | "";
  budgetMin?: string;
  budgetMax?: string;
  area?: string;
  bedrooms?: string;
  propertyType?: string;
  paymentMethod?: PaymentMethod | "";
  timeline?: string;
  status?: string;
  notes?: string;
  nextAction?: string;
};

const clean = (v?: string) => {
  const t = v?.trim();
  return t ? t : null;
};
const num = (v?: string) => {
  const n = v ? Number(v.replace(/[^\d.]/g, "")) : NaN;
  return Number.isFinite(n) ? Math.round(n) : null;
};

function toData(input: ClientInput) {
  return {
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: clean(input.email),
    nationality: clean(input.nationality),
    agencyName: clean(input.agencyName),
    clientType: input.clientType ? (input.clientType as ClientType) : null,
    budgetMin: num(input.budgetMin),
    budgetMax: num(input.budgetMax),
    area: clean(input.area),
    bedrooms: num(input.bedrooms),
    propertyType: clean(input.propertyType),
    paymentMethod: input.paymentMethod
      ? (input.paymentMethod as PaymentMethod)
      : null,
    timeline: clean(input.timeline),
    status: clean(input.status),
    notes: clean(input.notes),
    nextAction: clean(input.nextAction),
  };
}

export async function createClient(input: ClientInput) {
  const agent = await getCurrentAgent();
  if (!input.name?.trim() || !input.phone?.trim()) {
    throw new Error("Name and phone are required.");
  }

  let id: string;
  try {
    const client = await prisma.contact.create({
      data: { agentId: agent.id, ...toData(input) },
    });
    id = client.id;
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      throw new Error("A client with this phone number already exists.");
    }
    throw e;
  }

  revalidatePath("/clients");
  redirect(`/clients/${id}`);
}

export async function updateClient(id: string, input: ClientInput) {
  const agent = await getCurrentAgent();
  const existing = await prisma.contact.findFirst({
    where: { id, agentId: agent.id },
  });
  if (!existing) throw new Error("Client not found.");

  await prisma.contact.update({ where: { id }, data: toData(input) });
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}`);
}

/**
 * Auto-populate a client's requirements from their WhatsApp conversations.
 * Runs the AI analysis over each conversation, persists the conversation's
 * classification/urgency/summary, and fills any *empty* client fields from the
 * extracted requirements (existing values are never overwritten).
 */
export async function autoPopulateClient(id: string) {
  const agent = await getCurrentAgent();
  await populateClientFromConversations(id, agent.id);
  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
}
