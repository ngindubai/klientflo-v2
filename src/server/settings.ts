import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";

/** Get (or lazily create) the settings row for a specific agent. */
export async function getSettingsByAgent(agentId: string) {
  const existing = await prisma.settings.findUnique({ where: { agentId } });
  if (existing) return existing;
  return prisma.settings.create({ data: { agentId } });
}

/** Settings for the current agent. */
export async function getSettings() {
  const agent = await getCurrentAgent();
  return getSettingsByAgent(agent.id);
}

export type MessageTemplate = { id: string; name: string; body: string };

/** Parse the reusable WhatsApp message templates stored on Settings. */
export async function getMessageTemplates(): Promise<MessageTemplate[]> {
  const s = await getSettings();
  const raw = s.whatsappTemplates;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((t) =>
    t && typeof t === "object" && "name" in t && "body" in t
      ? [
          {
            id: String((t as Record<string, unknown>).id ?? ""),
            name: String((t as Record<string, unknown>).name ?? ""),
            body: String((t as Record<string, unknown>).body ?? ""),
          },
        ]
      : [],
  );
}
