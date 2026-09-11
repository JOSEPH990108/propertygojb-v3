import { createHmac } from "crypto";

import { describe, expect, it, afterEach } from "vitest";

import {
  getWhatsAppWebhookConfig,
  parseWhatsAppWebhookPayload,
  verifyWhatsAppSignature,
} from "./webhook";

describe("WhatsApp webhook boundary", () => {
  const originalSecret = process.env.WHATSAPP_APP_SECRET;
  const originalVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  afterEach(() => {
    process.env.WHATSAPP_APP_SECRET = originalSecret;
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = originalVerifyToken;
  });

  it("accepts the Meta sha256 signature for the exact raw body", () => {
    const rawBody = '{"object":"whatsapp_business_account"}';
    process.env.WHATSAPP_APP_SECRET = "test-secret";
    const digest = createHmac("sha256", "test-secret").update(rawBody).digest("hex");

    expect(verifyWhatsAppSignature(rawBody, `sha256=${digest}`)).toBe(true);
    expect(verifyWhatsAppSignature(`${rawBody} `, `sha256=${digest}`)).toBe(false);
  });

  it("rejects missing, malformed, and wrong signatures", () => {
    process.env.WHATSAPP_APP_SECRET = "test-secret";

    expect(verifyWhatsAppSignature("{}", null)).toBe(false);
    expect(verifyWhatsAppSignature("{}", "md5=abc")).toBe(false);
    expect(verifyWhatsAppSignature("{}", "sha256=abc")).toBe(false);
  });

  it("parses an object payload and rejects arrays", () => {
    expect(parseWhatsAppWebhookPayload('{"entry":[]}')).toEqual({ entry: [] });
    expect(() => parseWhatsAppWebhookPayload("[]")).toThrow();
  });

  it("keeps webhook verification configuration server-side", () => {
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = "verify-token";
    expect(getWhatsAppWebhookConfig().verifyToken).toBe("verify-token");
  });
});