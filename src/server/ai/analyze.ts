import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, isAIEnabled, AI_MODEL } from "@/server/ai/client";
import {
  ConversationAnalysisSchema,
  type AnalysisMessage,
  type ConversationAnalysis,
} from "@/server/ai/schema";
import { mockAnalyzeConversation } from "@/server/ai/mock";

const SYSTEM_PROMPT = `You are the AI assistant inside Klientflo, a WhatsApp-first operating system for a UAE real estate agent.

Analyse a WhatsApp conversation from the agent's point of view and return structured data:

- classification: the single best label for the conversation.
- urgency: 1 (no rush) to 5 (immediate action required). Score higher for viewing requests, ready/cash buyers and tenants, active negotiations, and contract/payment stages.
- summary: one or two sentences capturing what the contact wants, written for the agent.
- requirements: extract the buyer/tenant requirements stated or implied. Use null for anything not mentioned. Budgets are in AED as whole numbers (e.g. "2 million" -> 2000000, "120k" -> 120000). Recognise Dubai areas (Dubai Marina, Downtown, Palm Jumeirah, JVC, Business Bay, JLT, etc.).
- suggestedNextAction: the most useful next step the agent should take.

Be decisive and concise. Only extract requirements that are actually present.`;

function renderTranscript(messages: AnalysisMessage[]) {
  return messages
    .map(
      (m) => `${m.direction === "inbound" ? "Contact" : "Agent"}: ${m.text}`,
    )
    .join("\n");
}

/**
 * Analyse a conversation: classification, 1-5 urgency, summary, extracted
 * requirements, and a suggested next action. Uses Claude when configured,
 * otherwise a deterministic heuristic so the app runs without a key.
 */
export async function analyzeConversation(
  messages: AnalysisMessage[],
): Promise<ConversationAnalysis> {
  const client = getAnthropic();
  if (!client || !isAIEnabled()) {
    return mockAnalyzeConversation(messages);
  }

  try {
    const response = await client.messages.parse({
      model: AI_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      // Fast, structured analysis — low effort keeps latency/cost down.
      output_config: {
        effort: "low",
        format: zodOutputFormat(ConversationAnalysisSchema),
      },
      messages: [
        {
          role: "user",
          content: `Analyse this conversation:\n\n${renderTranscript(messages)}`,
        },
      ],
    });

    if (response.parsed_output) return response.parsed_output;
    // Refusal or unparseable output — fall back rather than failing the request.
    return mockAnalyzeConversation(messages);
  } catch (err) {
    console.error("[ai] analyzeConversation failed, using mock:", err);
    return mockAnalyzeConversation(messages);
  }
}
