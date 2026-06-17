import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { baseColumns } from "./base";
import { projects } from "./catalog";
import { files } from "./files";
import { areas, regions } from "./geo";
import { user } from "./identity-auth";
import { inquiries, leadSources, leads } from "./crm-leads";

export const whatsappAgentQueues = pgTable(
  "whatsapp_agent_queues",
  {
    ...baseColumns(),
    code: varchar("code", { length: 50 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    regionId: text("region_id").references(() => regions.id),
    areaId: text("area_id").references(() => areas.id),
    projectId: text("project_id").references(() => projects.id),
    assignmentStrategy: varchar("assignment_strategy", { length: 30 })
      .default("ROUND_ROBIN")
      .notNull(),
    maxQueueDepth: integer("max_queue_depth"),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (t) => ({
    codeUniq: unique().on(t.code),
    activeStrategyIdx: index("whatsapp_agent_queues_active_strategy_idx").on(
      t.isActive,
      t.assignmentStrategy,
    ),
  }),
);

export const whatsappAgentQueueMembers = pgTable(
  "whatsapp_agent_queue_members",
  {
    ...baseColumns(),
    queueId: text("queue_id")
      .references(() => whatsappAgentQueues.id)
      .notNull(),
    userId: text("user_id")
      .references(() => user.id)
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    weight: integer("weight").default(1).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    maxActiveLeads: integer("max_active_leads"),
    lastAssignedAt: timestamp("last_assigned_at"),
  },
  (t) => ({
    uniqQueueUser: unique().on(t.queueId, t.userId),
    queueIsActiveIdx: index("whatsapp_queue_members_queue_active_idx").on(
      t.queueId,
      t.isActive,
    ),
    userIsActiveIdx: index("whatsapp_queue_members_user_active_idx").on(
      t.userId,
      t.isActive,
    ),
    lastAssignedAtIdx: index("whatsapp_queue_members_last_assigned_at_idx").on(
      t.lastAssignedAt,
    ),
  }),
);

export const whatsappAssignmentRules = pgTable(
  "whatsapp_assignment_rules",
  {
    ...baseColumns(),
    name: varchar("name", { length: 120 }).notNull(),
    priority: integer("priority").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    triggerChannel: varchar("trigger_channel", { length: 30 })
      .default("WHATSAPP")
      .notNull(),
    matchSourceId: text("match_source_id").references(() => leadSources.id),
    matchRegionId: text("match_region_id").references(() => regions.id),
    matchAreaId: text("match_area_id").references(() => areas.id),
    matchProjectId: text("match_project_id").references(() => projects.id),
    matchLanguage: varchar("match_language", { length: 20 }),
    queueId: text("queue_id").references(() => whatsappAgentQueues.id),
    assignToUserId: text("assign_to_user_id").references(() => user.id),
    fallbackQueueId: text("fallback_queue_id").references(() => whatsappAgentQueues.id),
    effectiveFrom: timestamp("effective_from"),
    effectiveTo: timestamp("effective_to"),
    stopProcessingAfterMatch: boolean("stop_processing_after_match")
      .default(true)
      .notNull(),
  },
  (t) => ({
    uniqName: unique().on(t.name),
    activePriorityIdx: index("whatsapp_assignment_rules_active_priority_idx").on(
      t.isActive,
      t.priority,
    ),
  }),
);

export const whatsappConversations = pgTable(
  "whatsapp_conversations",
  {
    ...baseColumns(),
    leadId: text("lead_id").references(() => leads.id),
    inquiryId: text("inquiry_id").references(() => inquiries.id),
    provider: varchar("provider", { length: 30 }).notNull(),
    channelAccountId: varchar("channel_account_id", { length: 100 }),
    providerConversationId: varchar("provider_conversation_id", { length: 120 }),
    customerPhoneE164: varchar("customer_phone_e164", { length: 30 }).notNull(),
    customerPhoneNormalized: varchar("customer_phone_normalized", {
      length: 30,
    }).notNull(),
    customerDisplayName: varchar("customer_display_name", { length: 150 }),
    queueId: text("queue_id").references(() => whatsappAgentQueues.id),
    ownerUserId: text("owner_user_id").references(() => user.id),
    isOpen: boolean("is_open").default(true).notNull(),
    firstInboundAt: timestamp("first_inbound_at"),
    lastMessageAt: timestamp("last_message_at"),
    lastInboundAt: timestamp("last_inbound_at"),
    lastOutboundAt: timestamp("last_outbound_at"),
    closedAt: timestamp("closed_at"),
    closedReason: varchar("closed_reason", { length: 120 }),
  },
  (t) => ({
    oneOpenConversationUniq: uniqueIndex(
      "whatsapp_conversations_open_provider_phone_uniq",
    )
      .on(t.provider, t.customerPhoneNormalized)
      .where(sql`${t.isOpen} = true`),
    leadOpenIdx: index("whatsapp_conversations_lead_open_idx").on(t.leadId, t.isOpen),
    ownerOpenIdx: index("whatsapp_conversations_owner_open_idx").on(
      t.ownerUserId,
      t.isOpen,
    ),
  }),
);

export const whatsappMessages = pgTable(
  "whatsapp_messages",
  {
    ...baseColumns(),
    conversationId: text("conversation_id")
      .references(() => whatsappConversations.id)
      .notNull(),
    leadId: text("lead_id").references(() => leads.id),
    direction: varchar("direction", { length: 20 }).notNull(),
    messageType: varchar("message_type", { length: 30 }).notNull(),
    providerMessageId: varchar("provider_message_id", { length: 120 }),
    providerReplyToMessageId: varchar("provider_reply_to_message_id", {
      length: 120,
    }),
    textBody: text("text_body"),
    mediaFileId: text("media_file_id").references(() => files.id),
    mediaMimeType: varchar("media_mime_type", { length: 100 }),
    mediaSizeBytes: integer("media_size_bytes"),
    sentAtProvider: timestamp("sent_at_provider"),
    deliveredAtProvider: timestamp("delivered_at_provider"),
    readAtProvider: timestamp("read_at_provider"),
    failedAtProvider: timestamp("failed_at_provider"),
    failureCode: varchar("failure_code", { length: 80 }),
    failureReason: text("failure_reason"),
    payload: jsonb("payload"),
  },
  (t) => ({
    providerMessageIdUniq: unique().on(t.providerMessageId),
    conversationCreatedIdx: index("whatsapp_messages_conversation_created_idx").on(
      t.conversationId,
      t.createdAt,
    ),
    leadCreatedIdx: index("whatsapp_messages_lead_created_idx").on(t.leadId, t.createdAt),
  }),
);

export const whatsappWebhookEvents = pgTable(
  "whatsapp_webhook_events",
  {
    ...baseColumns(),
    provider: varchar("provider", { length: 30 }).notNull(),
    eventType: varchar("event_type", { length: 80 }).notNull(),
    eventKey: varchar("event_key", { length: 150 }).notNull(),
    providerEventId: varchar("provider_event_id", { length: 150 }),
    occurredAtProvider: timestamp("occurred_at_provider"),
    receivedAtServer: timestamp("received_at_server").notNull(),
    signatureValid: boolean("signature_valid"),
    processingStatus: varchar("processing_status", { length: 30 })
      .default("RECEIVED")
      .notNull(),
    processingAttempts: integer("processing_attempts").default(0).notNull(),
    processingError: text("processing_error"),
    nextRetryAt: timestamp("next_retry_at"),
    conversationId: text("conversation_id").references(() => whatsappConversations.id),
    messageId: text("message_id").references(() => whatsappMessages.id),
    leadId: text("lead_id").references(() => leads.id),
    payload: jsonb("payload").notNull(),
  },
  (t) => ({
    providerEventKeyUniq: unique().on(t.provider, t.eventKey),
    processingReceivedIdx: index("whatsapp_webhook_events_processing_received_idx").on(
      t.processingStatus,
      t.receivedAtServer,
    ),
    nextRetryIdx: index("whatsapp_webhook_events_next_retry_idx").on(t.nextRetryAt),
  }),
);

export const whatsappDeliveryEvents = pgTable(
  "whatsapp_delivery_events",
  {
    ...baseColumns(),
    messageId: text("message_id")
      .references(() => whatsappMessages.id)
      .notNull(),
    provider: varchar("provider", { length: 30 }).notNull(),
    providerEventId: varchar("provider_event_id", { length: 150 }),
    eventType: varchar("event_type", { length: 40 }).notNull(),
    eventStatus: varchar("event_status", { length: 40 }).notNull(),
    occurredAtProvider: timestamp("occurred_at_provider"),
    receivedAtServer: timestamp("received_at_server").notNull(),
    errorCode: varchar("error_code", { length: 80 }),
    errorDetail: text("error_detail"),
    payload: jsonb("payload"),
  },
  (t) => ({
    messageProviderEventUniq: uniqueIndex("whatsapp_delivery_events_message_provider_event_uniq")
      .on(t.messageId, t.providerEventId)
      .where(sql`${t.providerEventId} is not null`),
    messageCreatedIdx: index("whatsapp_delivery_events_message_created_idx").on(
      t.messageId,
      t.createdAt,
    ),
  }),
);
