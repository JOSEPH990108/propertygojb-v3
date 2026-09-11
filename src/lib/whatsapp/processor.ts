import "server-only";

import { and, count, eq, inArray, isNull } from "drizzle-orm";

import { db, schema } from "@/db";
import { writeAuditLog } from "@/lib/audit/log";

import {
  getWhatsAppMessageText,
  normalizeWhatsAppPhone,
  toWhatsAppMessageType,
  type WhatsAppInboundEvent,
  type WhatsAppWebhookPayload,
} from "./types";

type WhatsAppDb = Parameters<Parameters<typeof db.transaction>[0]>[0];

const ACTIVE_LEAD_STATUSES = [
  "NEW",
  "UNCONTACTED",
  "ASSIGNED",
  "CONTACTED",
  "QUALIFIED",
  "NURTURING",
  "APPOINTMENT_SET",
] as const;

function providerTimestamp(value?: string) {
  if (!value) return new Date();
  const timestamp = Number(value);
  return Number.isFinite(timestamp) ? new Date(timestamp * 1000) : new Date();
}

async function getWhatsAppLeadSource(tx: WhatsAppDb) {
  const existing = await tx.query.leadSources.findFirst({
    where: (table, { eq }) => eq(table.code, "WHATSAPP_INBOUND"),
    columns: { id: true },
  });

  if (existing) return existing.id;

  const inserted = await tx
    .insert(schema.leadSources)
    .values({
      code: "WHATSAPP_INBOUND",
      name: "WhatsApp Inbound",
      description: "Inbound enquiries received through WhatsApp Cloud API.",
      channel: "WHATSAPP_INBOUND",
      isActive: true,
      priority: 20,
    })
    .returning({ id: schema.leadSources.id });

  if (!inserted[0]) throw new Error("Unable to create WhatsApp lead source.");
  return inserted[0].id;
}

async function chooseAssignment(tx: WhatsAppDb, sourceId: string) {
  const rules = await tx.query.whatsappAssignmentRules.findMany({
    where: (table, { and, eq, isNull, or }) =>
      and(
        eq(table.isActive, true),
        eq(table.triggerChannel, "WHATSAPP"),
        or(eq(table.matchSourceId, sourceId), isNull(table.matchSourceId)),
      ),
    orderBy: (table, { asc }) => [asc(table.priority)],
  });

  for (const rule of rules) {
    const queueId = rule.queueId ?? rule.fallbackQueueId;
    if (!queueId) continue;

    const queue = await tx.query.whatsappAgentQueues.findFirst({
      where: (table, { and, eq, isNull }) =>
        and(eq(table.id, queueId), eq(table.isActive, true), isNull(table.deletedAt)),
      columns: { id: true, assignmentStrategy: true },
    });

    if (!queue) continue;
    if (rule.assignToUserId) {
      return { queueId: queue.id, userId: rule.assignToUserId, ruleId: rule.id };
    }

    const members = await tx.query.whatsappAgentQueueMembers.findMany({
      where: (table, { and, eq }) => and(eq(table.queueId, queue.id), eq(table.isActive, true)),
      orderBy: (table, { asc }) => [asc(table.lastAssignedAt), asc(table.sortOrder)],
    });

    for (const member of members) {
      if (member.maxActiveLeads === null) {
        return { queueId: queue.id, userId: member.userId, ruleId: rule.id, memberId: member.id };
      }

      const activeCount = await tx
        .select({ value: count() })
        .from(schema.leads)
        .where(
          and(
            eq(schema.leads.currentAssigneeUserId, member.userId),
            inArray(schema.leads.currentStatus, ACTIVE_LEAD_STATUSES),
            isNull(schema.leads.deletedAt),
          ),
        );

      if (Number(activeCount[0]?.value ?? 0) < member.maxActiveLeads) {
        return { queueId: queue.id, userId: member.userId, ruleId: rule.id, memberId: member.id };
      }
    }

    return { queueId: queue.id, userId: null, ruleId: rule.id };
  }

  return { queueId: null, userId: null, ruleId: null };
}

async function processMessage(
  tx: WhatsAppDb,
  event: WhatsAppInboundEvent,
  payload: WhatsAppWebhookPayload,
) {
  const message = event.message;
  if (!message?.from) return { leadId: null, conversationId: null, assignedUserId: null };

  const phoneNormalized = normalizeWhatsAppPhone(message.from);
  if (!phoneNormalized) throw new Error("WhatsApp message has no valid sender phone.");

  const receivedAt = providerTimestamp(message.timestamp);
  const sourceId = await getWhatsAppLeadSource(tx);
  const contactName = event.change.value?.contacts?.find((contact) => contact.wa_id === message.from)
    ?.profile?.name;

  const existingLead = await tx.query.leads.findFirst({
    where: (table, { eq }) => eq(table.primaryPhoneNormalized, phoneNormalized),
    columns: {
      id: true,
      fullName: true,
      currentStatus: true,
      currentAssigneeUserId: true,
      currentQueueId: true,
    },
  });

  let leadId = existingLead?.id;
  if (!leadId) {
    const inserted = await tx
      .insert(schema.leads)
      .values({
        sourceId,
        fullName: contactName ?? null,
        primaryPhoneE164: `+${phoneNormalized}`,
        primaryPhoneNormalized: phoneNormalized,
        currentStatus: "NEW",
        firstInquiryAt: receivedAt,
        lastActivityAt: receivedAt,
        metadata: { whatsapp: { provider: "WHATSAPP_CLOUD_API" } },
      })
      .returning({ id: schema.leads.id });
    leadId = inserted[0]?.id;
  } else {
    await tx
      .update(schema.leads)
      .set({
        fullName: contactName ?? existingLead?.fullName,
        lastActivityAt: receivedAt,
        updatedAt: receivedAt,
      })
      .where(eq(schema.leads.id, leadId));
  }

  if (!leadId) throw new Error("Unable to create WhatsApp lead.");

  const insertedInquiry = await tx
    .insert(schema.inquiries)
    .values({
      leadId,
      sourceId,
      channel: "WHATSAPP",
      externalReference: event.eventKey,
      requesterName: contactName ?? null,
      requesterPhoneE164: `+${phoneNormalized}`,
      requesterPhoneNormalized: phoneNormalized,
      messageText: getWhatsAppMessageText(message),
      payload,
      receivedAt,
    })
    .returning({ id: schema.inquiries.id });

  const existingConversation = await tx.query.whatsappConversations.findFirst({
    where: (table, { and, eq }) =>
      and(
        eq(table.provider, "WHATSAPP_CLOUD_API"),
        eq(table.customerPhoneNormalized, phoneNormalized),
        eq(table.isOpen, true),
      ),
    columns: { id: true, ownerUserId: true, queueId: true },
  });

  const conversation = existingConversation
    ? existingConversation
    : (
        await tx
          .insert(schema.whatsappConversations)
          .values({
            leadId,
            inquiryId: insertedInquiry[0]?.id,
            provider: "WHATSAPP_CLOUD_API",
            customerPhoneE164: `+${phoneNormalized}`,
            customerPhoneNormalized: phoneNormalized,
            customerDisplayName: contactName ?? null,
            isOpen: true,
            firstInboundAt: receivedAt,
            lastInboundAt: receivedAt,
            lastMessageAt: receivedAt,
          })
          .returning({ id: schema.whatsappConversations.id, ownerUserId: schema.whatsappConversations.ownerUserId, queueId: schema.whatsappConversations.queueId })
      )[0];

  if (!conversation) throw new Error("Unable to create WhatsApp conversation.");

  await tx
    .update(schema.whatsappConversations)
    .set({ leadId, inquiryId: insertedInquiry[0]?.id, lastInboundAt: receivedAt, lastMessageAt: receivedAt, updatedAt: receivedAt })
    .where(eq(schema.whatsappConversations.id, conversation.id));

  await tx.insert(schema.whatsappMessages).values({
    conversationId: conversation.id,
    leadId,
    direction: "INBOUND",
    messageType: toWhatsAppMessageType(message),
    providerMessageId: message.id,
    textBody: getWhatsAppMessageText(message),
    mediaMimeType: message.image?.mime_type ?? message.document?.mime_type,
    payload: message,
    sentAtProvider: receivedAt,
  });

  let assignedUserId = conversation.ownerUserId ?? existingLead?.currentAssigneeUserId ?? null;
  let queueId = conversation.queueId ?? existingLead?.currentQueueId ?? null;
  let assignmentId: string | null = null;
  let ruleId: string | null = null;

  if (!assignedUserId) {
    const assignment = await chooseAssignment(tx, sourceId);
    assignedUserId = assignment.userId;
    queueId = assignment.queueId;
    ruleId = assignment.ruleId;

    if (assignment.memberId) {
      await tx
        .update(schema.whatsappAgentQueueMembers)
        .set({ lastAssignedAt: receivedAt, updatedAt: receivedAt })
        .where(eq(schema.whatsappAgentQueueMembers.id, assignment.memberId));
    }

    if (assignedUserId || queueId) {
      const assignmentRow = await tx
        .insert(schema.leadAssignments)
        .values({
          leadId,
          toUserId: assignedUserId,
          queueId,
          assignmentType: "AUTOMATION",
          reasonCode: "WHATSAPP_INBOUND",
          reasonNote: "Assigned by WhatsApp inbound routing.",
          ruleId,
          effectiveFrom: receivedAt,
          isCurrent: true,
        })
        .returning({ id: schema.leadAssignments.id });
      assignmentId = assignmentRow[0]?.id ?? null;
    }
  }

  await tx
    .update(schema.whatsappConversations)
    .set({ ownerUserId: assignedUserId, queueId, updatedAt: receivedAt })
    .where(eq(schema.whatsappConversations.id, conversation.id));

  const nextStatus = assignedUserId ? "ASSIGNED" : existingLead?.currentStatus ?? "UNCONTACTED";
  await tx
    .update(schema.leads)
    .set({ currentAssigneeUserId: assignedUserId, currentQueueId: queueId, currentStatus: nextStatus, lastActivityAt: receivedAt, updatedAt: receivedAt })
    .where(eq(schema.leads.id, leadId));

  await tx.insert(schema.leadActivities).values({
    leadId,
    assignmentId,
    activityType: assignedUserId ? "WHATSAPP_LEAD_ASSIGNED" : "WHATSAPP_LEAD_QUEUED",
    title: assignedUserId ? "WhatsApp lead assigned" : "WhatsApp lead queued",
    body: assignedUserId
      ? "Inbound WhatsApp lead was assigned by the configured routing rule."
      : "Inbound WhatsApp lead is waiting in the configured WhatsApp queue.",
    visibilityScope: "INTERNAL",
    metadata: { conversationId: conversation.id, eventKey: event.eventKey, queueId, assignedUserId, ruleId },
  });

  if (existingLead?.currentStatus !== nextStatus) {
    await tx.insert(schema.leadStatusHistory).values({
      leadId,
      fromStatus: existingLead?.currentStatus ?? null,
      toStatus: nextStatus,
      changedAt: receivedAt,
      reasonCode: "WHATSAPP_INBOUND",
      sourceEventType: "WHATSAPP_INBOUND",
    });
  }

  return { leadId, conversationId: conversation.id, assignedUserId };
}

async function processStatus(tx: WhatsAppDb, event: WhatsAppInboundEvent) {
  const status = event.status;
  if (!status?.id) return { leadId: null, conversationId: null, assignedUserId: null };
  const providerMessageId = status.id;

  const message = await tx.query.whatsappMessages.findFirst({
    where: (table, { eq }) => eq(table.providerMessageId, providerMessageId),
    columns: { id: true, leadId: true, conversationId: true },
  });
  if (!message) return { leadId: null, conversationId: null, assignedUserId: null };

  const statusTime = providerTimestamp(status.timestamp);
  const statusCode = status.status?.toUpperCase();
  await tx
    .insert(schema.whatsappDeliveryEvents)
    .values({
      messageId: message.id,
      provider: "WHATSAPP_CLOUD_API",
      providerEventId: event.eventKey,
      eventType: statusCode ?? "UNKNOWN",
      eventStatus: statusCode ?? "UNKNOWN",
      occurredAtProvider: statusTime,
      receivedAtServer: new Date(),
      errorCode: status.errors?.[0]?.code?.toString(),
      errorDetail: status.errors?.[0]?.message ?? status.errors?.[0]?.title,
      payload: status,
    })
    .onConflictDoNothing();

  const update = {
    ...(statusCode === "DELIVERED" ? { deliveredAtProvider: statusTime } : {}),
    ...(statusCode === "READ" ? { readAtProvider: statusTime } : {}),
    ...(statusCode === "FAILED" ? { failedAtProvider: statusTime, failureCode: status.errors?.[0]?.code?.toString(), failureReason: status.errors?.[0]?.message } : {}),
    updatedAt: statusTime,
  };
  await tx.update(schema.whatsappMessages).set(update).where(eq(schema.whatsappMessages.id, message.id));
  return { leadId: message.leadId, conversationId: message.conversationId, assignedUserId: null };
}

export async function processWhatsAppEvent(
  event: WhatsAppInboundEvent,
  payload: WhatsAppWebhookPayload,
  rawPayload: unknown,
) {
  const result = await db.transaction(async (tx) => {
    const insertedEvent = await tx
      .insert(schema.whatsappWebhookEvents)
      .values({
        provider: "WHATSAPP_CLOUD_API",
        eventType: event.eventType,
        eventKey: event.eventKey,
        providerEventId: event.message?.id ?? event.status?.id,
        occurredAtProvider: providerTimestamp(event.message?.timestamp ?? event.status?.timestamp),
        receivedAtServer: new Date(),
        signatureValid: true,
        processingStatus: "RECEIVED",
        processingAttempts: 1,
        payload: rawPayload,
      })
      .onConflictDoNothing()
      .returning({ id: schema.whatsappWebhookEvents.id });

    if (!insertedEvent[0]) return { duplicate: true, leadId: null, conversationId: null, assignedUserId: null };

    const processed = event.eventType === "message_received"
      ? await processMessage(tx, event, payload)
      : await processStatus(tx, event);

    await tx
      .update(schema.whatsappWebhookEvents)
      .set({ processingStatus: "PROCESSED", updatedAt: new Date(), leadId: processed.leadId, conversationId: processed.conversationId })
      .where(eq(schema.whatsappWebhookEvents.id, insertedEvent[0].id));

    return { duplicate: false, ...processed };
  });

  if (!result.duplicate) {
    await writeAuditLog({
      actionType: event.eventType === "message_received" ? "WHATSAPP_INBOUND" : "WHATSAPP_STATUS",
      entityType: "WHATSAPP_CONVERSATION",
      entityId: result.conversationId,
      sourceApp: "SYSTEM",
      changeSummary: event.eventType === "message_received" ? "Inbound WhatsApp event processed." : "WhatsApp delivery status processed.",
      metadata: { eventKey: event.eventKey, leadId: result.leadId, assignedUserId: result.assignedUserId },
    });
  }

  return result;
}