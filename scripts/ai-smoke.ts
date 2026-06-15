/**
 * Smoke test for the AI core layer. Runs without an API key by exercising the
 * heuristic mock, validates each result against the structured-output schema,
 * and confirms the schema converts to an Anthropic structured-output format.
 *
 *   pnpm ai:smoke
 */
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { mockAnalyzeConversation } from "@/server/ai/mock";
import {
  ConversationAnalysisSchema,
  type AnalysisMessage,
} from "@/server/ai/schema";

const SAMPLES: { name: string; messages: AnalysisMessage[] }[] = [
  {
    name: "Hot cash buyer, viewing this weekend",
    messages: [
      {
        direction: "inbound",
        text: "Hi, I'm looking for a 2 bedroom apartment in Dubai Marina, budget up to 2 million, cash. Can we view this weekend?",
      },
    ],
  },
  {
    name: "Tenant enquiry",
    messages: [
      {
        direction: "inbound",
        text: "Is the Downtown 1 bedroom still available to rent? Around 120k annual.",
      },
    ],
  },
  {
    name: "Document stage",
    messages: [
      {
        direction: "inbound",
        text: "Please send me the Ejari, and I'll share my passport and visa copies.",
      },
    ],
  },
];

// Confirm the schema is a valid Anthropic structured-output format.
const format = zodOutputFormat(ConversationAnalysisSchema);
console.log(`Structured-output format ready: ${format.type}\n`);

let failures = 0;
for (const sample of SAMPLES) {
  const analysis = mockAnalyzeConversation(sample.messages);
  const parsed = ConversationAnalysisSchema.safeParse(analysis);
  const ok = parsed.success ? "OK " : "FAIL";
  if (!parsed.success) failures++;
  console.log(`[${ok}] ${sample.name}`);
  console.log(
    `   ${analysis.classification} · urgency ${analysis.urgency} · ${analysis.summary}`,
  );
  console.log(`   next: ${analysis.suggestedNextAction}`);
  console.log(`   reqs: ${JSON.stringify(analysis.requirements)}\n`);
}

if (failures) {
  console.error(`${failures} sample(s) failed schema validation`);
  process.exit(1);
}
console.log("All samples passed schema validation.");
