import { getAnthropic, isAIEnabled, AI_MODEL } from "@/server/ai/client";

const SYSTEM = `You are KlientFlo's assistant helping a UAE real estate agent write a short, professional WhatsApp message to a PROPERTY OWNER. The agent wants to reach owners about a buyer/tenant interested in their building or unit. Keep it warm, polite and concise (2-3 sentences), natural for WhatsApp, no "Dear" salutations. Do not invent specific names; you may reference figures only if they are in the brief. Return only the message text.`;

/** Generate a professional owner-outreach WhatsApp message from a short brief. */
export async function generateOutreachMessage(brief: string): Promise<string> {
  const trimmed = brief.trim();
  const client = getAnthropic();
  if (!client || !isAIEnabled()) return mockOutreach(trimmed);

  try {
    const res = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 300,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Write the message. Brief: ${
            trimmed || "I have a serious buyer interested in this owner's property."
          }`,
        },
      ],
    });
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    return text || mockOutreach(trimmed);
  } catch (err) {
    console.error("[ai] generateOutreachMessage failed, using mock:", err);
    return mockOutreach(trimmed);
  }
}

/** Deterministic fallback when no AI key is configured. */
function mockOutreach(brief: string): string {
  const b = brief.toLowerCase();
  if (/\b(rent|tenant|lease|rental)\b/.test(b)) {
    return "Hello, I'm a real estate agent with a qualified tenant actively looking to rent in your building. If you'd consider letting your unit, I'd be glad to arrange a viewing with a serious, pre-vetted client. Would you be open to a quick chat?";
  }
  return "Hello, I'm a real estate agent representing a buyer who is ready to purchase in your building. If you'd consider selling your unit, I can bring a serious, pre-qualified client. Would you be open to discussing it?";
}
