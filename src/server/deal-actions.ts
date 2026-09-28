"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import { stagesFor } from "@/server/deals";
import { DEAL_TYPES, humanizeEnum, type DealType } from "@/lib/constants";
import { parseTaskInput, suggestedDealTasks, type TaskInput } from "@/lib/deal-workflow";

function refreshDeal(id: string) {
  for (const path of ["/pipeline", "/opportunities", "/dashboard", `/deals/${id}`]) revalidatePath(path);
}

async function ownedDeal(id: string) {
  const agent = await getCurrentAgent();
  const deal = await prisma.deal.findFirst({ where: { id, agentId: agent.id } });
  if (!deal) throw new Error("Deal not found.");
  return { deal, agent };
}

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
  if (deal.stage === stage) return;
  await prisma.deal.update({ where: { id, agentId: agent.id }, data: {
    stage,
    activity: { create: { summary: `Stage changed from ${humanizeEnum(deal.stage)} to ${humanizeEnum(stage)}.` } },
  } });
  refreshDeal(id);
}

export type DealInput = {
  clientId?: string;
  type: string;
  propertyId?: string;
  amount?: string;
  stage?: string;
  notes?: string;
  includeChecklist?: boolean;
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

  for (const [id, model] of [[input.clientId, "contact"], [input.propertyId, "property"]] as const) {
    if (id?.trim()) {
      const found = model === "contact"
        ? await prisma.contact.findFirst({ where: { id: id.trim(), agentId: agent.id }, select: { id: true } })
        : await prisma.property.findFirst({ where: { id: id.trim(), agentId: agent.id }, select: { id: true } });
      if (!found) throw new Error(`Choose a ${model === "contact" ? "client" : "property"} from this workspace.`);
    }
  }
  const deal = await prisma.deal.create({
    data: {
      agentId: agent.id,
      type,
      stage,
      clientId: input.clientId?.trim() || null,
      propertyId: input.propertyId?.trim() || null,
      amount: Number.isFinite(amount as number) ? amount : null,
      notes: input.notes?.trim() || null,
      tasks: { create: input.includeChecklist === false ? [] : suggestedDealTasks(type, stage).map(t => ({ ...t, assignee: agent.name })) },
      activity: { create: { summary: "Deal created." } },
    },
  });

  refreshDeal(deal.id);
  redirect(`/deals/${deal.id}`);
}

export async function saveDealTask(dealId: string, taskId: string | null, input: TaskInput) {
  const { deal } = await ownedDeal(dealId);
  const data = parseTaskInput(input, deal.type);
  await prisma.$transaction(async tx => {
    if (taskId) {
      const result = await tx.dealTask.updateMany({ where: { id: taskId, dealId }, data });
      if (!result.count) throw new Error("Task not found in this deal.");
    } else {
      await tx.dealTask.create({ data: { ...data, dealId } });
    }
    await tx.deal.update({ where: { id: dealId }, data: { updatedAt: new Date(), activity: {
      create: { summary: `${taskId ? "Updated" : "Added"} task: ${data.title}` },
    } } });
  });
  refreshDeal(dealId);
}

export async function setDealTaskStatus(dealId: string, taskId: string, status: string) {
  await ownedDeal(dealId);
  if (!["pending", "done", "dismissed"].includes(status)) throw new Error("Invalid task status.");
  await prisma.$transaction(async tx => {
    const task = await tx.dealTask.findFirst({ where: { id: taskId, dealId } });
    if (!task) throw new Error("Task not found in this deal.");
    if (task.status === status) return;
    await tx.dealTask.update({ where: { id: taskId }, data: { status, completedAt: status === "done" ? new Date() : null } });
    await tx.deal.update({ where: { id: dealId }, data: { updatedAt: new Date(), activity: {
      create: { summary: `${status === "done" ? "Completed" : status === "dismissed" ? "Dismissed" : "Reopened"} task: ${task.title}` },
    } } });
  });
  refreshDeal(dealId);
}

export async function addSuggestedDealTasks(dealId: string) {
  const { deal, agent } = await ownedDeal(dealId);
  const result = await prisma.$transaction(async tx => {
    const added = await tx.dealTask.createMany({
      data: suggestedDealTasks(deal.type, deal.stage).map(t => ({ ...t, dealId, assignee: agent.name })),
      skipDuplicates: true,
    });
    if (added.count) await tx.deal.update({ where: { id: dealId }, data: { updatedAt: new Date(), activity: {
      create: { summary: `Added ${added.count} suggested tasks from ${humanizeEnum(deal.stage)} onwards.` },
    } } });
    return added.count;
  });
  refreshDeal(dealId);
  return result;
}

export async function saveDealNotes(dealId: string, notes: string) {
  await ownedDeal(dealId);
  if (typeof notes !== "string" || notes.length > 10000) throw new Error("Keep deal notes under 10,000 characters.");
  await prisma.deal.update({ where: { id: dealId }, data: {
    notes: notes.trim() || null, activity: { create: { summary: "Deal notes updated." } },
  } });
  refreshDeal(dealId);
}
