import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  verifyWebhookChallenge,
  verifySignature,
  parseWebhook,
} from "@/server/whatsapp";
import { ingestInbound } from "@/server/whatsapp-ingest";
import { getCurrentAgent } from "@/server/agent";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// GET — Meta webhook verification handshake.
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const challenge = verifyWebhookChallenge(params);
  if (challenge !== null) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// POST — inbound messages and status updates.
export async function POST(req: Request) {
  // Coarse abuse guard (signature is the real auth); 300 requests/min per IP.
  const rl = rateLimit(`wh:${clientIp(req.headers)}`, 300, 60_000);
  if (!rl.ok) {
    return new NextResponse("Too many requests", {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
    });
  }

  const raw = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  if (!verifySignature(raw, signature)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  const inbound = parseWebhook(payload);
  if (inbound.length > 0) {
    // Phase 1 is single-agent; multi-agent maps phone_number_id -> agent.
    const agent = await getCurrentAgent();
    for (const msg of inbound) {
      if (msg.from) await ingestInbound(agent.id, msg);
    }
    revalidatePath("/inbox");
    revalidatePath("/dashboard");
  }

  // WhatsApp expects a prompt 200 to avoid retries.
  return NextResponse.json({ received: true });
}
