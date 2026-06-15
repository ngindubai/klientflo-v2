import crypto from "crypto";
import type { MessageType } from "@/generated/prisma/client";

// WhatsApp Business Cloud API integration. Real HTTP calls fire when the
// WHATSAPP_* env vars are set; otherwise we run in mock mode so the inbox and
// two-way messaging work end-to-end without Meta credentials.

const GRAPH_VERSION = "v21.0";

export function isWhatsAppConfigured() {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID,
  );
}

export type SendResult = { externalId: string; mock: boolean };

/** Send a plain text WhatsApp message. Falls back to a mock id when unconfigured. */
export async function sendText(to: string, body: string): Promise<SendResult> {
  if (!isWhatsAppConfigured()) {
    return { externalId: `mock-${Date.now()}`, mock: true };
  }
  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: true, body },
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`WhatsApp send failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return { externalId: data.messages?.[0]?.id ?? `wamid-${Date.now()}`, mock: false };
}

// --- Webhook verification & parsing -------------------------------------

/** Verify the GET webhook handshake; returns the challenge to echo, or null. */
export function verifyWebhookChallenge(params: URLSearchParams): string | null {
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === "subscribe" && expected && token === expected) {
    return challenge;
  }
  return null;
}

/** Verify the X-Hub-Signature-256 header against the raw body. Skipped if no app secret. */
export function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true; // not configured — accept (mock/dev)
  if (!signature) return false;
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export type InboundMessage = {
  externalId: string;
  from: string;
  name: string | null;
  type: MessageType;
  text: string | null;
  mediaId: string | null;
};

function mapType(t: string): MessageType {
  switch (t) {
    case "audio":
    case "voice":
      return "voice";
    case "image":
      return "image";
    case "document":
      return "document";
    default:
      return "text";
  }
}

/** Extract normalised inbound messages from a WhatsApp webhook payload. */
export function parseWebhook(payload: unknown): InboundMessage[] {
  const out: InboundMessage[] = [];
  const entries = (payload as { entry?: unknown[] })?.entry ?? [];
  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] })?.changes ?? [];
    for (const change of changes) {
      const value = (change as { value?: Record<string, unknown> })?.value ?? {};
      const contacts = (value.contacts as { profile?: { name?: string } }[]) ?? [];
      const name = contacts[0]?.profile?.name ?? null;
      const messages = (value.messages as Record<string, unknown>[]) ?? [];
      for (const m of messages) {
        const type = mapType(String(m.type));
        const text =
          (m.text as { body?: string })?.body ??
          (m[String(m.type)] as { caption?: string })?.caption ??
          null;
        const media = m[String(m.type)] as { id?: string } | undefined;
        out.push({
          externalId: String(m.id ?? `wamid-${Date.now()}`),
          from: String(m.from ?? ""),
          name,
          type,
          text,
          mediaId: type !== "text" ? (media?.id ?? null) : null,
        });
      }
    }
  }
  return out;
}
