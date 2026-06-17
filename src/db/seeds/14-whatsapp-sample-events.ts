import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";

type DB = PostgresJsDatabase<typeof schema>;

export async function seedWhatsAppSampleEvents(db: DB) {
  if (process.env.APP_ENV !== "development") {
    return;
  }

  if (process.env.ENABLE_PHASE1B_SAMPLE_WHATSAPP_EVENTS !== "true") {
    return;
  }

  const source = await db.query.leadSources.findFirst({
    where: (table, { eq }) => eq(table.code, "WHATSAPP_INBOUND"),
  });

  if (!source) {
    return;
  }

  await db
    .insert(schema.leads)
    .values({
      sourceId: source.id,
      fullName: "Sample WhatsApp Lead",
      primaryPhoneE164: "+601111000002",
      primaryPhoneNormalized: "601111000002",
      currentStatus: "UNCONTACTED",
      firstInquiryAt: new Date(),
      metadata: {
        purpose: "phase1b_whatsapp_sample",
      },
    })
    .onConflictDoNothing();

  const sampleLead = await db.query.leads.findFirst({
    where: (table, { eq }) => eq(table.primaryPhoneNormalized, "601111000002"),
  });

  if (!sampleLead) {
    return;
  }

  let conversation = await db.query.whatsappConversations.findFirst({
    where: (table, { and, eq }) =>
      and(
        eq(table.provider, "WHATSAPP_CLOUD_API"),
        eq(table.customerPhoneNormalized, "601111000002"),
        eq(table.isOpen, true),
      ),
  });

  if (!conversation) {
    const [createdConversation] = await db
      .insert(schema.whatsappConversations)
      .values({
        leadId: sampleLead.id,
        provider: "WHATSAPP_CLOUD_API",
        customerPhoneE164: "+601111000002",
        customerPhoneNormalized: "601111000002",
        customerDisplayName: "Sample WhatsApp Lead",
        isOpen: true,
        firstInboundAt: new Date(),
      })
      .returning();

    conversation = createdConversation;
  }

  if (!conversation) {
    return;
  }

  await db
    .insert(schema.whatsappMessages)
    .values({
      conversationId: conversation.id,
      leadId: sampleLead.id,
      direction: "INBOUND",
      messageType: "TEXT",
      providerMessageId: "phase1b-sample-wa-message-001",
      textBody: "Hi, I am interested in a unit.",
      payload: {
        kind: "sample",
      },
      sentAtProvider: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.whatsappMessages.providerMessageId,
      set: {
        textBody: "Hi, I am interested in a unit.",
      },
    });

  const sampleMessage = await db.query.whatsappMessages.findFirst({
    where: (table, { eq }) =>
      eq(table.providerMessageId, "phase1b-sample-wa-message-001"),
  });

  if (!sampleMessage) {
    return;
  }

  await db
    .insert(schema.whatsappWebhookEvents)
    .values({
      provider: "WHATSAPP_CLOUD_API",
      eventType: "message_received",
      eventKey: "phase1b-sample-wa-webhook-001",
      receivedAtServer: new Date(),
      processingStatus: "PROCESSED",
      conversationId: conversation.id,
      messageId: sampleMessage.id,
      leadId: sampleLead.id,
      payload: {
        kind: "sample",
      },
    })
    .onConflictDoNothing();

  await db
    .insert(schema.whatsappDeliveryEvents)
    .values({
      messageId: sampleMessage.id,
      provider: "WHATSAPP_CLOUD_API",
      providerEventId: "phase1b-sample-delivery-001",
      eventType: "DELIVERED",
      eventStatus: "DELIVERED",
      occurredAtProvider: new Date(),
      receivedAtServer: new Date(),
      payload: {
        kind: "sample",
      },
    })
    .onConflictDoNothing();
}
