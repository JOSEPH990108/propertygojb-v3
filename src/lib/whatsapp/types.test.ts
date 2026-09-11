import { describe, expect, it } from "vitest";

import { getWhatsAppInboundEvents, getWhatsAppMessageText, normalizeWhatsAppPhone } from "./types";

describe("WhatsApp webhook event extraction", () => {
  it("extracts text, button, list, and status events with stable keys", () => {
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "waba-1",
          changes: [
            {
              field: "messages",
              value: {
                contacts: [{ wa_id: "60123456789", profile: { name: "Ari" } }],
                messages: [
                  { id: "wamid-text", from: "60123456789", type: "text", text: { body: "Hi" } },
                  { id: "wamid-button", from: "60123456789", type: "interactive", interactive: { type: "button_reply", button_reply: { id: "intent.price", title: "Price" } } },
                  { id: "wamid-list", from: "60123456789", type: "interactive", interactive: { type: "list_reply", list_reply: { id: "project.one", title: "Project One" } } },
                ],
                statuses: [{ id: "wamid-outbound", status: "delivered", timestamp: "1700000000" }],
              },
            },
          ],
        },
      ],
    };

    const events = getWhatsAppInboundEvents(payload);

    expect(events.map((event) => event.eventKey)).toEqual([
      "message:wamid-text",
      "message:wamid-button",
      "message:wamid-list",
      "status:wamid-outbound:delivered",
    ]);
    expect(getWhatsAppMessageText(events[1].message!)).toBe("intent.price");
    expect(getWhatsAppMessageText(events[2].message!)).toBe("project.one");
  });

  it("normalizes sender identifiers to digits", () => {
    expect(normalizeWhatsAppPhone("+60 (12) 345-6789")).toBe("60123456789");
  });
});