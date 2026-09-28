import { prisma } from "@/lib/db";
import { getSettingsByAgent } from "@/server/settings";
import { isWithinQuietHours } from "@/lib/quiet-hours";
import { sendText } from "@/server/whatsapp";
import { getAnthropic, isAIEnabled, AI_MODEL } from "@/server/ai/client";

const GUARDRAILS = `You are an AI assistant replying on behalf of a UAE real estate agent over WhatsApp.

You MAY: greet and qualify buyers/tenants, ask for their requirements (budget, area, bedrooms, timeline, buy vs rent), suggest suitable properties at a high level, offer to send an information pack, and offer viewing slots.

You MUST NOT: negotiate or agree final deal terms or prices, make legal statements or give legal advice, confirm that an offer is accepted, or share or promise restricted/confidential documents. If the contact pushes on any of these, say the agent will follow up personally.

Keep it warm, professional and concise (2–4 sentences). Return only the message text — no preamble, no quotes.`;

const MOCK_REPLY =
  "Hi! Thanks for reaching out. To help me find the right fit, could you let me know your budget, preferred area, and whether you're looking to buy or rent? I'll send a few options and we can arrange a viewing.";

async function generateReply(transcript: string, agentName: string, tone: string) {
  const client = getAnthropic();
  if (!client || !isAIEnabled()) return MOCK_REPLY;
  try {
    const res = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 400,
      system: `${GUARDRAILS}\n\nThe agent is ${agentName}. Tone: ${tone}.`,
      output_config: { effort: "low" },
      messages: [
        { role: "user", content: `Conversation so far:\n${transcript}\n\nWrite the next reply:` },
      ],
    });
    const block = res.content.find((b) => b.type === "text");
    return block && block.type === "text" ? block.text.trim() : MOCK_REPLY;
  } catch (err) {
    console.error("[ai] generateReply failed:", err);
    return MOCK_REPLY;
  }
}

/**
 * After an inbound message, decide whether to respond automatically:
 *  - During quiet hours: send the configured holding message (at most once per
 *    quiet window) and stop.
 *  - Otherwise, if auto-reply is enabled: generate a guard-railed reply, then
 *    either send it (auto_send) or store it as a pending AI draft for approval.
 */
export async function maybeAutoReply(agentId: string, conversationId: string) {
  const settings = await getSettingsByAgent(agentId);
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) return;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, agentId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) return;

  // --- Quiet hours ---
  if (isWithinQuietHours(settings)) {
    const since = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const recentOutbound = await prisma.message.count({
      where: { conversationId, direction: "outbound", createdAt: { gte: since } },
    });
    if (recentOutbound === 0 && settings.quietHoursMessage) {
      await deliver(agentId, conversation.contactPhone, conversationId, settings.quietHoursMessage, {
        send: true,
        clearReplyFlag: false,
      });
    }
    return;
  }

  if (!settings.aiAutoReplyEnabled) return;

  const transcript = conversation.messages
    .map((m) => `${m.direction === "inbound" ? "Contact" : "Agent"}: ${m.transcription ?? m.body ?? ""}`)
    .filter((l) => l.trim().length > "Contact: ".length)
    .join("\n");

  const reply = await generateReply(transcript, agent.name, settings.aiTone);

  if (settings.aiApprovalMode === "auto_send") {
    await deliver(agentId, conversation.contactPhone, conversationId, reply, {
      send: true,
      clearReplyFlag: true,
    });
  } else {
    // Store a pending AI draft for the agent to approve in the inbox.
    await prisma.message.create({
      data: {
        agentId,
        conversationId,
        direction: "outbound",
        type: "text",
        body: reply,
        status: "pending",
        aiGenerated: true,
      },
    });
  }
}

async function deliver(
  agentId: string,
  to: string,
  conversationId: string,
  body: string,
  opts: { send: boolean; clearReplyFlag: boolean },
) {
  let externalId: string | null = null;
  let status: "sent" | "failed" = "sent";
  if (opts.send) {
    try {
      externalId = (await sendText(to, body)).externalId;
    } catch {
      status = "failed";
    }
  }
  await prisma.message.create({
    data: {
      agentId,
      conversationId,
      direction: "outbound",
      type: "text",
      body,
      status,
      externalId,
      aiGenerated: true,
    },
  });
  if (opts.clearReplyFlag && status !== "failed") {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { awaitingReply: false },
    });
  }
}
