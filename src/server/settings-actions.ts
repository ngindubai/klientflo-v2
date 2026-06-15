"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";

export type AiSettingsInput = {
  aiAutoReplyEnabled: boolean;
  aiApprovalMode: "auto_send" | "require_approval";
  aiTone: string;
  followUpAutomation: boolean;
  viewingBookingAutomation: boolean;
  newLeadAutomation: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  quietHoursDays: number[];
  quietHoursMessage: string;
};

export async function updateAiSettings(input: AiSettingsInput) {
  const agent = await getCurrentAgent();
  const clean = (s: string) => (s.trim() ? s.trim() : null);

  const data = {
    aiAutoReplyEnabled: input.aiAutoReplyEnabled,
    aiApprovalMode: input.aiApprovalMode,
    aiTone: input.aiTone.trim() || "professional and friendly",
    followUpAutomation: input.followUpAutomation,
    viewingBookingAutomation: input.viewingBookingAutomation,
    newLeadAutomation: input.newLeadAutomation,
    quietHoursStart: clean(input.quietHoursStart),
    quietHoursEnd: clean(input.quietHoursEnd),
    quietHoursDays: input.quietHoursDays.filter((d) => d >= 0 && d <= 6),
    quietHoursMessage: clean(input.quietHoursMessage),
  };

  await prisma.settings.upsert({
    where: { agentId: agent.id },
    create: { agentId: agent.id, ...data },
    update: data,
  });
  revalidatePath("/settings");
  revalidatePath("/inbox");
}
