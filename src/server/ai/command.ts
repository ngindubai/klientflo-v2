"use server";

import type Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import { getAnthropic, isAIEnabled, AI_MODEL } from "@/server/ai/client";
import type { CommandResult } from "@/server/ai/command-types";
import {
  NAV_ITEMS,
  SALES_PIPELINE_STAGES,
  RENTAL_PIPELINE_STAGES,
  humanizeEnum,
  type ClientType,
} from "@/lib/constants";
import { formatTime } from "@/lib/utils";

// --- Tool definitions ----------------------------------------------------

const TOOLS: Anthropic.Tool[] = [
  {
    name: "search_clients",
    description:
      "Search the agent's clients/leads by name, phone or email, optionally filtered by type or area.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Free-text name/phone/email" },
        clientType: {
          type: "string",
          enum: ["buyer", "tenant", "seller", "landlord"],
        },
        area: { type: "string" },
      },
    },
  },
  {
    name: "search_properties",
    description:
      "Search the property portfolio. Budgets are AED whole numbers (e.g. 2 million -> 2000000).",
    input_schema: {
      type: "object",
      properties: {
        area: { type: "string" },
        bedrooms: { type: "integer" },
        minPrice: { type: "integer" },
        maxPrice: { type: "integer" },
        propertyType: { type: "string", description: "e.g. Apartment, Villa" },
      },
    },
  },
  {
    name: "show_urgent_messages",
    description: "Show conversations with high urgency (4-5).",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "show_pending_replies",
    description: "Show conversations awaiting a reply from the agent.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "show_todays_schedule",
    description: "Show today's viewings and meetings.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "move_deal",
    description:
      "Move a client's deal to a new pipeline stage. Stage is a human label like 'Viewing booked' or 'Offer accepted'.",
    input_schema: {
      type: "object",
      properties: {
        clientName: { type: "string" },
        stage: { type: "string" },
      },
      required: ["clientName", "stage"],
    },
  },
  {
    name: "draft_reply",
    description:
      "Draft (do not send) a professional, warm WhatsApp reply for the agent. Put the full reply text in `reply`.",
    input_schema: {
      type: "object",
      properties: {
        recipient: { type: "string", description: "Who the reply is to" },
        reply: { type: "string", description: "The drafted reply message" },
      },
      required: ["reply"],
    },
  },
  {
    name: "open_page",
    description:
      "Navigate to a section of the app. href must be one of /dashboard /inbox /clients /properties /calendar /documents /settings.",
    input_schema: {
      type: "object",
      properties: { href: { type: "string" } },
      required: ["href"],
    },
  },
  {
    name: "respond",
    description:
      "Reply with a short plain-text message when no other tool fits (greetings, clarifications, capabilities).",
    input_schema: {
      type: "object",
      properties: { message: { type: "string" } },
      required: ["message"],
    },
  },
];

const SYSTEM_PROMPT = `You are the AI command bar inside Klientflo, a WhatsApp-first operating system for a UAE real estate agent. The agent types or speaks natural-language commands; you pick the single best tool to satisfy each one.

Guidance:
- For lookups ("show urgent WhatsApps", "find 2-bed apartments in Dubai Marina under 2 million", "today's meetings") use the matching search/show tool.
- For "reply…", "respond…", "follow up…", "draft…": use draft_reply and write the full message yourself in a warm, professional, concise UAE real-estate tone. Never claim to have sent it.
- For "move <client> to <stage>" use move_deal.
- For "open/go to <section>" use open_page.
- Otherwise use respond.
Convert AED amounts to whole numbers (2 million -> 2000000, 120k -> 120000).`;

// --- Handlers ------------------------------------------------------------

type Input = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v.trim() : undefined);
const int = (v: unknown) =>
  typeof v === "number" ? Math.round(v) : undefined;

async function searchClients(
  agentId: string,
  input: Input,
): Promise<CommandResult> {
  const query = str(input.query);
  const area = str(input.area);
  const clientType = str(input.clientType) as ClientType | undefined;

  const clients = await prisma.client.findMany({
    where: {
      agentId,
      ...(clientType ? { clientType } : {}),
      ...(area ? { area: { contains: area, mode: "insensitive" } } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { phone: { contains: query } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    take: 8,
    orderBy: { updatedAt: "desc" },
  });

  return {
    kind: "clients",
    message: clients.length
      ? `Found ${clients.length} client${clients.length === 1 ? "" : "s"}.`
      : "No matching clients.",
    clients: clients.map((c) => ({
      id: c.id,
      name: c.name,
      subtitle:
        [c.clientType && humanizeEnum(c.clientType), c.area, c.status]
          .filter(Boolean)
          .join(" · ") || c.phone,
    })),
  };
}

async function searchProperties(
  agentId: string,
  input: Input,
): Promise<CommandResult> {
  const area = str(input.area);
  const propertyType = str(input.propertyType);
  const bedrooms = int(input.bedrooms);
  const minPrice = int(input.minPrice);
  const maxPrice = int(input.maxPrice);

  const properties = await prisma.property.findMany({
    where: {
      agentId,
      status: "active",
      ...(area ? { area: { contains: area, mode: "insensitive" } } : {}),
      ...(propertyType
        ? { propertyType: { contains: propertyType, mode: "insensitive" } }
        : {}),
      ...(bedrooms !== undefined ? { bedrooms } : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            price: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            },
          }
        : {}),
    },
    take: 8,
    orderBy: { price: "asc" },
  });

  return {
    kind: "properties",
    message: properties.length
      ? `Found ${properties.length} matching propert${properties.length === 1 ? "y" : "ies"}.`
      : "No properties match those criteria.",
    properties: properties.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      area: p.area,
      bedrooms: p.bedrooms,
    })),
  };
}

async function showUrgent(agentId: string): Promise<CommandResult> {
  const convos = await prisma.conversation.findMany({
    where: { agentId, urgency: { gte: 4 } },
    orderBy: [{ urgency: "desc" }, { lastMessageAt: "desc" }],
    take: 8,
    include: { client: true },
  });
  return {
    kind: "conversations",
    message: convos.length
      ? `${convos.length} urgent conversation${convos.length === 1 ? "" : "s"}.`
      : "Nothing urgent right now.",
    conversations: convos.map((c) => ({
      id: c.id,
      name: c.client?.name ?? c.contactName ?? c.contactPhone,
      urgency: c.urgency,
      summary: c.summary ?? "",
    })),
  };
}

async function showPending(agentId: string): Promise<CommandResult> {
  const convos = await prisma.conversation.findMany({
    where: { agentId, awaitingReply: true },
    orderBy: { lastMessageAt: "asc" },
    take: 8,
    include: { client: true },
  });
  return {
    kind: "conversations",
    message: convos.length
      ? `${convos.length} conversation${convos.length === 1 ? "" : "s"} awaiting your reply.`
      : "You're all caught up.",
    conversations: convos.map((c) => ({
      id: c.id,
      name: c.client?.name ?? c.contactName ?? c.contactPhone,
      urgency: c.urgency,
      summary: c.summary ?? "",
    })),
  };
}

async function showTodaysSchedule(agentId: string): Promise<CommandResult> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const events = await prisma.event.findMany({
    where: { agentId, startsAt: { gte: start, lte: end } },
    orderBy: { startsAt: "asc" },
  });
  return {
    kind: "events",
    message: events.length
      ? `You have ${events.length} thing${events.length === 1 ? "" : "s"} today.`
      : "Nothing scheduled today.",
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      time: formatTime(e.startsAt),
      type: humanizeEnum(e.type),
    })),
  };
}

const ALL_STAGES = [...SALES_PIPELINE_STAGES, ...RENTAL_PIPELINE_STAGES];

async function moveDeal(
  agentId: string,
  input: Input,
): Promise<CommandResult> {
  const clientName = str(input.clientName);
  const stageLabel = str(input.stage);
  if (!clientName || !stageLabel) {
    return { kind: "info", message: "Tell me which client and which stage." };
  }

  // Match the requested stage to a known pipeline stage by its human label.
  const target = stageLabel.toLowerCase().replace(/[^a-z]+/g, "");
  const stage = ALL_STAGES.find(
    (s) => humanizeEnum(s).toLowerCase().replace(/[^a-z]+/g, "") === target,
  );
  if (!stage) {
    return {
      kind: "info",
      message: `"${stageLabel}" isn't a pipeline stage I recognise.`,
    };
  }

  const deal = await prisma.deal.findFirst({
    where: {
      agentId,
      client: { name: { contains: clientName, mode: "insensitive" } },
      stage: { notIn: ["closed_won", "closed_lost"] },
    },
    include: { client: true },
    orderBy: { updatedAt: "desc" },
  });
  if (!deal) {
    return {
      kind: "info",
      message: `No active deal found for "${clientName}".`,
    };
  }

  await prisma.deal.update({
    where: { id: deal.id },
    data: { stage },
  });

  return {
    kind: "info",
    message: `Moved ${deal.client?.name ?? "the deal"} to “${humanizeEnum(stage)}”.`,
  };
}

function draftReply(input: Input): CommandResult {
  const reply = str(input.reply);
  if (!reply) return { kind: "info", message: "Nothing to draft." };
  return {
    kind: "draft",
    message: "Draft ready — review before sending.",
    draft: reply,
    recipient: str(input.recipient),
  };
}

function openPage(input: Input): CommandResult {
  const href = str(input.href) ?? "";
  const match = NAV_ITEMS.find((n) => n.href === href);
  if (!match) {
    return { kind: "info", message: "I'm not sure which page you mean." };
  }
  return { kind: "navigate", message: `Opening ${match.label}.`, href };
}

async function dispatch(
  name: string,
  input: Input,
  agentId: string,
): Promise<CommandResult> {
  switch (name) {
    case "search_clients":
      return searchClients(agentId, input);
    case "search_properties":
      return searchProperties(agentId, input);
    case "show_urgent_messages":
      return showUrgent(agentId);
    case "show_pending_replies":
      return showPending(agentId);
    case "show_todays_schedule":
      return showTodaysSchedule(agentId);
    case "move_deal":
      return moveDeal(agentId, input);
    case "draft_reply":
      return draftReply(input);
    case "open_page":
      return openPage(input);
    case "respond":
      return { kind: "info", message: str(input.message) ?? "" };
    default:
      return { kind: "info", message: "I couldn't action that." };
  }
}

// --- Claude path ---------------------------------------------------------

async function runViaClaude(
  text: string,
  agentId: string,
): Promise<CommandResult> {
  const client = getAnthropic()!;
  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: TOOLS,
    tool_choice: { type: "any", disable_parallel_tool_use: true },
    output_config: { effort: "low" },
    messages: [{ role: "user", content: text }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return { kind: "info", message: "I couldn't action that — try rephrasing." };
  }
  return dispatch(toolUse.name, (toolUse.input as Input) ?? {}, agentId);
}

// --- Mock path (no API key) ---------------------------------------------

const AREAS = [
  "Dubai Marina",
  "Downtown Dubai",
  "Downtown",
  "Palm Jumeirah",
  "Jumeirah Village Circle",
  "JVC",
  "Business Bay",
  "JLT",
];

function parsePropertyFilters(text: string): Input {
  const area = AREAS.find((a) => text.includes(a.toLowerCase()));
  const bed = text.match(/(\d+)\s*(?:-|\s)?(?:bed|bedroom|br\b)/);
  let maxPrice: number | undefined;
  const m = text.match(/(\d+(?:\.\d+)?)\s*(?:million|m\b)/);
  const k = text.match(/(\d+(?:\.\d+)?)\s*k\b/);
  if (m) maxPrice = Math.round(parseFloat(m[1]) * 1_000_000);
  else if (k) maxPrice = Math.round(parseFloat(k[1]) * 1_000);
  let propertyType: string | undefined;
  if (/\bvilla\b/.test(text)) propertyType = "Villa";
  else if (/\b(apartment|flat|studio)\b/.test(text)) propertyType = "Apartment";
  return {
    area: area === "Downtown" ? "Downtown" : area,
    bedrooms: bed ? Number(bed[1]) : undefined,
    maxPrice,
    propertyType,
  };
}

async function runViaMock(
  text: string,
  agentId: string,
): Promise<CommandResult> {
  const t = text.toLowerCase();

  if (/\b(open|go to|show me the)\b/.test(t)) {
    const match = NAV_ITEMS.find((n) =>
      t.includes(n.label.toLowerCase().replace("whatsapp ", "")),
    );
    if (match) return openPage({ href: match.href });
  }
  if (/\burgent\b/.test(t)) return showUrgent(agentId);
  if (/\b(pending|awaiting|to reply|need(?:s)? (?:a )?repl)/.test(t))
    return showPending(agentId);
  if (
    /\btoday\b/.test(t) &&
    /\b(meetings?|viewings?|schedule|calendar|diary|appointments?)\b/.test(t)
  )
    return showTodaysSchedule(agentId);

  const moveMatch = t.match(/move\s+(.+?)\s+to\s+(.+)/);
  if (moveMatch) {
    return moveDeal(agentId, { clientName: moveMatch[1], stage: moveMatch[2] });
  }

  if (/\b(reply|respond|draft|follow.?up|message)\b/.test(t)) {
    return {
      kind: "draft",
      message:
        "Draft ready (template — connect an API key for AI-written replies).",
      draft:
        "Hi! Thank you for your message — I'll confirm the details and get back to you shortly. Best regards.",
    };
  }

  if (
    /\b(propert|apartment|flat|villa|studio|bedroom|\bbr\b|marina|downtown|palm|jvc|jlt)\b/.test(
      t,
    )
  ) {
    return searchProperties(agentId, parsePropertyFilters(t));
  }

  if (/\b(clients?|leads?|buyers?|tenants?|sellers?|landlords?|contacts?)\b/.test(t)) {
    const clientType = /\bbuyers?\b/.test(t)
      ? "buyer"
      : /\btenants?\b/.test(t)
        ? "tenant"
        : /\bsellers?\b/.test(t)
          ? "seller"
          : /\blandlords?\b/.test(t)
            ? "landlord"
            : undefined;
    return searchClients(agentId, { clientType });
  }

  return {
    kind: "info",
    message:
      "I can show urgent messages, pending replies and today's schedule, search clients and properties, move deals, and draft replies. Add an Anthropic API key to unlock full natural-language understanding.",
  };
}

// --- Public entry point --------------------------------------------------

/** Run a natural-language command from the global AI command bar. */
export async function runCommand(text: string): Promise<CommandResult> {
  const trimmed = text.trim();
  if (!trimmed) return { kind: "info", message: "Type a command to begin." };

  const agent = await getCurrentAgent();
  try {
    return isAIEnabled()
      ? await runViaClaude(trimmed, agent.id)
      : await runViaMock(trimmed, agent.id);
  } catch (err) {
    console.error("[ai] runCommand failed:", err);
    // Fall back to the heuristic router so the bar still does something useful.
    return runViaMock(trimmed, agent.id);
  }
}
