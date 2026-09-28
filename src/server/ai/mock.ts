import type {
  AnalysisMessage,
  ConversationAnalysis,
  Requirements,
} from "@/server/ai/schema";
import type {
  ClientType,
  ConversationClassification,
  ContactCategory,
  PaymentMethod,
} from "@/lib/constants";

// A deterministic, keyword-driven stand-in for the Claude analysis. Lets the
// whole app run end-to-end before an ANTHROPIC_API_KEY is supplied. The real
// analyser (analyze.ts) produces far richer results.

const AREAS = [
  "Dubai Marina",
  "Downtown Dubai",
  "Palm Jumeirah",
  "Jumeirah Village Circle",
  "JVC",
  "Business Bay",
  "JLT",
  "Jumeirah Lake Towers",
];

function inboundText(messages: AnalysisMessage[]) {
  return messages
    .filter((m) => m.direction === "inbound")
    .map((m) => m.text)
    .join("\n")
    .toLowerCase();
}

function extractRequirements(text: string): Requirements {
  const area = AREAS.find((a) => text.includes(a.toLowerCase())) ?? null;

  const bedroomMatch = text.match(/(\d+)\s*(?:-|\s)?(?:bed|bedroom|br\b)/);
  const bedrooms = bedroomMatch ? Number(bedroomMatch[1]) : null;

  // Budget like "2 million", "1.8m", "120k", "AED 650,000".
  let budgetMax: number | null = null;
  const millions = text.match(/(\d+(?:\.\d+)?)\s*(?:million|m\b)/);
  const thousands = text.match(/(\d+(?:\.\d+)?)\s*k\b/);
  const plain = text.match(/aed\s*([\d,]{4,})/);
  if (millions) budgetMax = Math.round(parseFloat(millions[1]) * 1_000_000);
  else if (thousands) budgetMax = Math.round(parseFloat(thousands[1]) * 1_000);
  else if (plain) budgetMax = Number(plain[1].replace(/,/g, ""));

  let clientType: ClientType | null = null;
  if (/\b(rent|tenant|lease|annual)\b/.test(text)) clientType = "tenant";
  else if (/\b(buy|purchase|invest|mortgage|cash)\b/.test(text))
    clientType = "buyer";
  else if (/\bsell\b/.test(text)) clientType = "seller";
  else if (/\b(landlord|my (?:unit|property|apartment))\b/.test(text))
    clientType = "landlord";

  let paymentMethod: PaymentMethod | null = null;
  if (/\bcash\b/.test(text)) paymentMethod = "cash";
  else if (/\bmortgage\b/.test(text)) paymentMethod = "mortgage";

  let propertyType: string | null = null;
  if (/\bvilla\b/.test(text)) propertyType = "Villa";
  else if (/\b(apartment|flat|studio)\b/.test(text)) propertyType = "Apartment";

  let timeline: string | null = null;
  if (/\b(weekend|today|tomorrow|asap|urgent|this week)\b/.test(text))
    timeline = "This week";
  else if (/\b(this month|soon)\b/.test(text)) timeline = "This month";

  return {
    clientType,
    area,
    budgetMin: null,
    budgetMax,
    bedrooms,
    propertyType,
    paymentMethod,
    timeline,
  };
}

function classify(text: string): {
  classification: ConversationClassification;
  urgency: number;
} {
  if (!text.trim()) return { classification: "low_priority", urgency: 1 };
  if (/\b(unsubscribe|spam|lottery|crypto giveaway)\b/.test(text))
    return { classification: "spam", urgency: 1 };
  if (/\b(viewing|visit|appointment|view (?:the |this |an? )?(?:property|apartment|villa|unit)|see the (?:property|apartment|villa|unit))\b/.test(text))
    return { classification: "viewing_request", urgency: 5 };
  if (/\b(contract|mou|form f|sign|deposit|transfer)\b/.test(text))
    return { classification: "contract_stage", urgency: 4 };
  if (/\b(negotiate|negotiation|offer|counteroffer|discount|lower (?:the )?price|reduce (?:the )?price)\b/.test(text))
    return { classification: "price_negotiation", urgency: 4 };
  if (/\b(passport|emirates id|visa|documents?|ejari)\b/.test(text))
    return { classification: "document_request", urgency: 3 };
  if (/\b(ready to (?:buy|purchase|proceed)|cash buyer|make (?:an? )?offer|proceed with (?:the )?purchase)\b/.test(text))
    return { classification: "hot_lead", urgency: 4 };
  return { classification: "new_enquiry", urgency: 3 };
}

/** Heuristic contact-category guess (the AI does this far better). */
function categorize(
  text: string,
  classification: ConversationClassification,
): ContactCategory {
  if (!text.trim()) return "client";
  if (
    classification === "spam" ||
    /\b(unsubscribe|lottery|crypto|giveaway|loan offer|click here|congratulations you)\b/.test(
      text,
    )
  )
    return "spam";
  if (/\b(co-?broke|co-?broking|fellow agent|i'?m an agent|our agency|my agency|broker to broker|share (?:the )?listing|commission split)\b/.test(text))
    return "agent";
  if (/\b(roi|yield|rental return|investment|investor|portfolio|capital appreciation|off-?plan|cap rate)\b/.test(text))
    return "investor";
  if (/\b(happy birthday|how are you|dinner|family|see you (?:later|tonight)|lunch)\b/.test(text))
    return "personal";
  return "client";
}

export function mockAnalyzeConversation(
  messages: AnalysisMessage[],
): ConversationAnalysis {
  const text = inboundText(messages);
  const { classification, urgency } = classify(text);
  const contactCategory = categorize(text, classification);
  const requirements = extractRequirements(text);

  const parts: string[] = [];
  if (requirements.bedrooms) parts.push(`${requirements.bedrooms}-bed`);
  if (requirements.propertyType) parts.push(requirements.propertyType.toLowerCase());
  if (requirements.area) parts.push(`in ${requirements.area}`);
  const wants = parts.length ? parts.join(" ") : "a property";
  const budget = requirements.budgetMax
    ? ` up to AED ${requirements.budgetMax.toLocaleString()}`
    : "";

  const summary =
    classification === "spam"
      ? "Looks like spam — low priority."
      : `Contact is interested in ${wants}${budget}.`;

  const suggestedNextAction =
    classification === "viewing_request"
      ? "Offer viewing slots and send matching listings."
      : classification === "document_request"
        ? "Request the outstanding documents."
        : classification === "contract_stage"
          ? "Progress the deal and confirm next steps."
          : "Send matching properties and qualify the lead.";

  return {
    classification,
    urgency,
    summary,
    contactCategory,
    requirements,
    suggestedNextAction,
  };
}
