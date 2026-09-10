import { NextRequest } from "next/server";

import { writeAuditLog } from "@/lib/audit/log";
import { getWhatsAppInboundEvents } from "@/lib/whatsapp/types";
import { parseWhatsAppWebhookPayload, verifyWhatsAppSignature } from "@/lib/whatsapp/webhook";
import { processWhatsAppEvent } from "@/lib/whatsapp/processor";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (
    mode !== "subscribe" ||
    !challenge ||
    !process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
    token !== process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    return new Response("Forbidden", { status: 403 });
  }

  return new Response(challenge, { status: 200 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyWhatsAppSignature(rawBody, signature)) {
    try {
      await writeAuditLog({
        actionType: "WHATSAPP_WEBHOOK_REJECTED",
        entityType: "WHATSAPP_WEBHOOK",
        sourceApp: "SYSTEM",
        changeSummary: "Rejected WhatsApp webhook with invalid signature.",
        metadata: { signaturePresent: Boolean(signature) },
        request,
      });
    } catch {
      // Do not turn a security rejection into an information leak.
    }

    return new Response("Invalid signature", { status: 401 });
  }

  let payload: ReturnType<typeof parseWhatsAppWebhookPayload>;
  try {
    payload = parseWhatsAppWebhookPayload(rawBody);
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  const events = getWhatsAppInboundEvents(payload);
  for (const event of events) {
    await processWhatsAppEvent(event, payload, payload);
  }

  return Response.json({ received: true, processed: events.length });
}