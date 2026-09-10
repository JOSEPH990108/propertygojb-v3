import { createHmac, timingSafeEqual } from "crypto";

import type { WhatsAppWebhookPayload } from "./types";

export function verifyWhatsAppSignature(rawBody: string, signature: string | null) {
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (!appSecret || !signature?.startsWith("sha256=")) {
    return false;
  }

  const received = Buffer.from(signature.slice("sha256=".length), "hex");
  const expected = createHmac("sha256", appSecret).update(rawBody).digest();

  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function parseWhatsAppWebhookPayload(rawBody: string): WhatsAppWebhookPayload {
  const payload: unknown = JSON.parse(rawBody);

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("WhatsApp webhook payload must be an object.");
  }

  return payload as WhatsAppWebhookPayload;
}

export function getWhatsAppWebhookConfig() {
  return {
    verifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    wabaId: process.env.WHATSAPP_WABA_ID ?? "",
    graphApiVersion: process.env.WHATSAPP_GRAPH_API_VERSION ?? "v23.0",
  };
}