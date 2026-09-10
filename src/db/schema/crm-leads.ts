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
import {
  projectLayouts,
  projectPhases,
  projects,
  projectTowers,
} from "./catalog";
import { leadStatusEnum } from "./enums";
import { areas, regions } from "./geo";
import { user } from "./identity-auth";
import { units } from "./inventory";
import { propertyCategories, propertyTypes } from "./lookups";
import {
  whatsappAgentQueues,
  whatsappAssignmentRules,
} from "./whatsapp-routing";

export const leadSources = pgTable(
  "lead_sources",
  {
    ...baseColumns(),
    code: varchar("code", { length: 50 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    channel: varchar("channel", { length: 30 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    priority: integer("priority").default(0).notNull(),
    assignmentSlaMinutes: integer("assignment_sla_minutes"),
    firstResponseSlaMinutes: integer("first_response_sla_minutes"),
    businessHoursJson: jsonb("business_hours_json"),
  },
  (t) => ({
    uniqCode: unique().on(t.code),
    channelIdx: index("lead_sources_channel_idx").on(t.channel),
    priorityIdx: index("lead_sources_priority_idx").on(t.priority),
  }),
);

export const leads = pgTable(
  "leads",
  {
    ...baseColumns(),
    sourceId: text("source_id")
      .references(() => leadSources.id)
      .notNull(),
    customerUserId: text("customer_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    fullName: varchar("full_name", { length: 150 }),
    primaryPhoneE164: varchar("primary_phone_e164", { length: 30 }).notNull(),
    primaryPhoneNormalized: varchar("primary_phone_normalized", {
      length: 30,
    }).notNull(),
    email: varchar("email", { length: 255 }),
    preferredLanguage: varchar("preferred_language", { length: 20 }),
    nationality: varchar("nationality", { length: 100 }),
    desiredPropertyCategoryId: text("desired_property_category_id").references(
      () => propertyCategories.id,
    ),
    desiredPropertyTypeId: text("desired_property_type_id").references(
      () => propertyTypes.id,
    ),
    preferredRegionId: text("preferred_region_id").references(() => regions.id),
    preferredAreaId: text("preferred_area_id").references(() => areas.id),
    currentStatus: leadStatusEnum("current_status").default("NEW").notNull(),
    currentAssigneeUserId: text("current_assignee_user_id").references(
      () => user.id,
    ),
    currentQueueId: text("current_queue_id").references(
      () => whatsappAgentQueues.id,
    ),
    firstInquiryAt: timestamp("first_inquiry_at"),
    lastActivityAt: timestamp("last_activity_at"),
    firstAssignedAt: timestamp("first_assigned_at"),
    firstRespondedAt: timestamp("first_responded_at"),
    assignmentDueAt: timestamp("assignment_due_at"),
    firstResponseDueAt: timestamp("first_response_due_at"),
    closedAt: timestamp("closed_at"),
    closedReason: varchar("closed_reason", { length: 120 }),
    metadata: jsonb("metadata"),
  },
  (t) => ({
    activePhoneUniq: uniqueIndex("leads_phone_normalized_active_uniq")
      .on(t.primaryPhoneNormalized)
      .where(sql`${t.deletedAt} is null`),
    sourceIdx: index("leads_source_idx").on(t.sourceId),
    customerUserIdx: index("leads_customer_user_idx").on(t.customerUserId),
    statusUpdatedIdx: index("leads_status_updated_idx").on(
      t.currentStatus,
      t.updatedAt,
    ),
    assigneeStatusIdx: index("leads_assignee_status_idx").on(
      t.currentAssigneeUserId,
      t.currentStatus,
    ),
    queueStatusIdx: index("leads_queue_status_idx").on(
      t.currentQueueId,
      t.currentStatus,
    ),
  }),
);

export const inquiries = pgTable(
  "inquiries",
  {
    ...baseColumns(),
    leadId: text("lead_id")
      .references(() => leads.id)
      .notNull(),
    sourceId: text("source_id")
      .references(() => leadSources.id)
      .notNull(),
    channel: varchar("channel", { length: 30 }).notNull(),
    externalReference: varchar("external_reference", { length: 150 }),
    requesterName: varchar("requester_name", { length: 150 }),
    requesterPhoneE164: varchar("requester_phone_e164", { length: 30 }),
    requesterPhoneNormalized: varchar("requester_phone_normalized", { length: 30 }),
    requesterEmail: varchar("requester_email", { length: 255 }),
    projectId: text("project_id").references(() => projects.id),
    phaseId: text("phase_id").references(() => projectPhases.id),
    towerId: text("tower_id").references(() => projectTowers.id),
    layoutId: text("layout_id").references(() => projectLayouts.id),
    unitId: text("unit_id").references(() => units.id),
    messageText: text("message_text"),
    payload: jsonb("payload"),
    receivedAt: timestamp("received_at").notNull(),
  },
  (t) => ({
    externalReferenceUniq: unique().on(t.externalReference),
    leadReceivedIdx: index("inquiries_lead_received_idx").on(t.leadId, t.receivedAt),
    projectReceivedIdx: index("inquiries_project_received_idx").on(
      t.projectId,
      t.receivedAt,
    ),
  }),
);

export const leadAssignments = pgTable(
  "lead_assignments",
  {
    ...baseColumns(),
    leadId: text("lead_id")
      .references(() => leads.id)
      .notNull(),
    fromUserId: text("from_user_id").references(() => user.id),
    toUserId: text("to_user_id").references(() => user.id),
    queueId: text("queue_id").references(() => whatsappAgentQueues.id),
    assignedByUserId: text("assigned_by_user_id").references(() => user.id),
    assignmentType: varchar("assignment_type", { length: 30 }).notNull(),
    reasonCode: varchar("reason_code", { length: 50 }),
    reasonNote: text("reason_note"),
    ruleId: text("rule_id").references(() => whatsappAssignmentRules.id),
    effectiveFrom: timestamp("effective_from").defaultNow().notNull(),
    effectiveTo: timestamp("effective_to"),
    isCurrent: boolean("is_current").default(true).notNull(),
  },
  (t) => ({
    oneCurrentLeadAssignmentUniq: uniqueIndex("lead_assignments_current_uniq")
      .on(t.leadId)
      .where(sql`${t.isCurrent} = true`),
    leadEffectiveFromIdx: index("lead_assignments_lead_effective_from_idx").on(
      t.leadId,
      t.effectiveFrom,
    ),
    toUserCurrentIdx: index("lead_assignments_to_user_current_idx").on(
      t.toUserId,
      t.isCurrent,
    ),
  }),
);

export const leadActivities = pgTable(
  "lead_activities",
  {
    ...baseColumns(),
    leadId: text("lead_id")
      .references(() => leads.id)
      .notNull(),
    assignmentId: text("assignment_id").references(() => leadAssignments.id),
    actorUserId: text("actor_user_id").references(() => user.id),
    activityType: varchar("activity_type", { length: 40 }).notNull(),
    title: varchar("title", { length: 150 }),
    body: text("body"),
    dueAt: timestamp("due_at"),
    completedAt: timestamp("completed_at"),
    visibilityScope: varchar("visibility_scope", { length: 20 })
      .default("INTERNAL")
      .notNull(),
    metadata: jsonb("metadata"),
  },
  (t) => ({
    leadCreatedIdx: index("lead_activities_lead_created_idx").on(t.leadId, t.createdAt),
  }),
);

export const leadStatusHistory = pgTable(
  "lead_status_history",
  {
    ...baseColumns(),
    leadId: text("lead_id")
      .references(() => leads.id)
      .notNull(),
    fromStatus: leadStatusEnum("from_status"),
    toStatus: leadStatusEnum("to_status").notNull(),
    changedByUserId: text("changed_by_user_id").references(() => user.id),
    changedAt: timestamp("changed_at").defaultNow().notNull(),
    reasonCode: varchar("reason_code", { length: 50 }),
    reasonNote: text("reason_note"),
    sourceEventType: varchar("source_event_type", { length: 40 }),
  },
  (t) => ({
    leadChangedAtIdx: index("lead_status_history_lead_changed_at_idx").on(
      t.leadId,
      t.changedAt,
    ),
  }),
);
