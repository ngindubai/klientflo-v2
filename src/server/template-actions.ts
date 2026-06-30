"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";

export type TemplateInput = { name: string; kind: string; body: string };

export async function createTemplate(input: TemplateInput) {
  const agent = await getCurrentAgent();
  if (!input.name?.trim()) throw new Error("Template name is required.");
  const t = await prisma.template.create({
    data: {
      agentId: agent.id,
      name: input.name.trim(),
      kind: input.kind || "brochure",
      body: input.body ?? "",
    },
  });
  revalidatePath("/storage");
  return t.id;
}

export async function updateTemplate(id: string, input: TemplateInput) {
  const agent = await getCurrentAgent();
  const existing = await prisma.template.findFirst({
    where: { id, agentId: agent.id },
    select: { id: true },
  });
  if (!existing) throw new Error("Template not found.");
  await prisma.template.update({
    where: { id },
    data: {
      name: input.name.trim(),
      kind: input.kind || "brochure",
      body: input.body ?? "",
    },
  });
  revalidatePath("/storage");
}

export async function deleteTemplate(id: string) {
  const agent = await getCurrentAgent();
  const existing = await prisma.template.findFirst({
    where: { id, agentId: agent.id },
    select: { id: true },
  });
  if (!existing) throw new Error("Template not found.");
  await prisma.template.delete({ where: { id } });
  revalidatePath("/storage");
}
