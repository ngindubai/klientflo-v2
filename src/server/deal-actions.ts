"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import { stagesFor } from "@/server/deals";
import { DEAL_TYPES, type DealType } from "@/lib/constants";

/** Move a deal to a new stage within its own pipeline. */
export async function setDealStage(id: string, stage: string) {
  const agent = await getCurrentAgent();
  const deal = await prisma.deal.findFirst({
    where: { id, agentId: agent.id },
  });
  if (!deal) throw new Error("Deal not found.");
  if (!stagesFor(deal.type).includes(stage)) {
    throw new Error("Invalid stage for this pipeline.");
  }
  await prisma.deal.update({ where: { id }, data: { stage } });
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
}

export type DealInput = {
  clientId?: string;
  type: string;
  propertyId?: string;
  amount?: string;
  stage?: string;
  notes?: string;
};

export async function createDeal(input: DealInput) {
  const agent = await getCurrentAgent();
  const type = (DEAL_TYPES as readonly string[]).includes(input.type)
    ? (input.type as DealType)
    : "sale";
  const stage =
    input.stage && stagesFor(type).includes(input.stage)
      ? input.stage
      : "new_enquiry";
  const amount = input.amount
    ? Math.round(Number(input.amount.replace(/[^\d.]/g, "")))
    : null;

  await prisma.deal.create({
    data: {
      agentId: agent.id,
      type,
      stage,
      clientId: input.clientId?.trim() || null,
      propertyId: input.propertyId?.trim() || null,
      amount: Number.isFinite(amount as number) ? amount : null,
      notes: input.notes?.trim() || null,
    },
  });

  revalidatePath("/pipeline");
  redirect(`/pipeline?type=${type}`);
}
