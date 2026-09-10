export type WhatsAppWebhookPayload = {
  object?: string;
  entry?: WhatsAppWebhookEntry[];
};

export type WhatsAppWebhookEntry = {
  id?: string;
  changes?: WhatsAppWebhookChange[];
};

export type WhatsAppWebhookChange = {
  field?: string;
  value?: WhatsAppWebhookValue;
};

export type WhatsAppWebhookValue = {
  messaging_product?: string;
  metadata?: {
    display_phone_number?: string;
    phone_number_id?: string;
  };
  contacts?: Array<{
    profile?: { name?: string };
    wa_id?: string;
  }>;
  messages?: WhatsAppInboundMessage[];
  statuses?: WhatsAppStatusEvent[];
};

export type WhatsAppInboundMessage = {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  interactive?: {
    type?: string;
    button_reply?: { id?: string; title?: string };
    list_reply?: { id?: string; title?: string; description?: string };
  };
  image?: { id?: string; mime_type?: string; sha256?: string; caption?: string };
  document?: {
    id?: string;
    mime_type?: string;
    sha256?: string;
    filename?: string;
    caption?: string;
  };
};

export type WhatsAppStatusEvent = {
  id?: string;
  status?: string;
  timestamp?: string;
  recipient_id?: string;
  errors?: Array<{ code?: number; title?: string; message?: string }>;
};

export type WhatsAppInboundEvent = {
  eventKey: string;
  eventType: "message_received" | "message_status";
  message?: WhatsAppInboundMessage;
  status?: WhatsAppStatusEvent;
  change: WhatsAppWebhookChange;
  entryId?: string;
};

export function getWhatsAppInboundEvents(
  payload: WhatsAppWebhookPayload,
): WhatsAppInboundEvent[] {
  const events: WhatsAppInboundEvent[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages" || !change.value) {
        continue;
      }

      for (const message of change.value.messages ?? []) {
        if (message.id) {
          events.push({
            eventKey: `message:${message.id}`,
            eventType: "message_received",
            message,
            change,
            entryId: entry.id,
          });
        }
      }

      for (const status of change.value.statuses ?? []) {
        if (status.id) {
          events.push({
            eventKey: `status:${status.id}:${status.status ?? "unknown"}`,
            eventType: "message_status",
            status,
            change,
            entryId: entry.id,
          });
        }
      }
    }
  }

  return events;
}

export function normalizeWhatsAppPhone(value: string) {
  return value.replace(/\D/g, "");
}

export function toWhatsAppMessageType(message: WhatsAppInboundMessage) {
  if (message.type === "text") return "TEXT";
  if (message.type === "interactive") return "INTERACTIVE";
  if (message.type === "image") return "IMAGE";
  if (message.type === "document") return "DOCUMENT";
  return (message.type ?? "UNKNOWN").toUpperCase().slice(0, 30);
}

export function getWhatsAppMessageText(message: WhatsAppInboundMessage) {
  if (message.text?.body) return message.text.body;
  if (message.interactive?.button_reply?.id) {
    return message.interactive.button_reply.id;
  }
  if (message.interactive?.list_reply?.id) {
    return message.interactive.list_reply.id;
  }
  return null;
}