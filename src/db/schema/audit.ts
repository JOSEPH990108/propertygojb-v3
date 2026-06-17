import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { account, roles, session, user } from "./identity-auth";

const idColumn = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID());

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: idColumn(),
    actorUserId: text("actor_user_id").references(() => user.id),
    actorRoleId: text("actor_role_id").references(() => roles.id),
    actionType: varchar("action_type", { length: 40 }).notNull(),
    entityType: varchar("entity_type", { length: 60 }).notNull(),
    entityId: text("entity_id"),
    requestId: varchar("request_id", { length: 120 }),
    traceId: varchar("trace_id", { length: 120 }),
    beforeJson: jsonb("before_json"),
    afterJson: jsonb("after_json"),
    changeSummary: text("change_summary"),
    sourceApp: varchar("source_app", { length: 30 }).notNull(),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    entityCreatedIdx: index("audit_logs_entity_created_idx").on(
      t.entityType,
      t.entityId,
      t.createdAt,
    ),
    actorCreatedIdx: index("audit_logs_actor_created_idx").on(
      t.actorUserId,
      t.createdAt,
    ),
    actionCreatedIdx: index("audit_logs_action_created_idx").on(
      t.actionType,
      t.createdAt,
    ),
    sourceCreatedIdx: index("audit_logs_source_created_idx").on(
      t.sourceApp,
      t.createdAt,
    ),
  }),
);

export const authAuditLogs = pgTable(
  "auth_audit_logs",
  {
    id: idColumn(),
    userId: text("user_id").references(() => user.id),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    eventStatus: varchar("event_status", { length: 20 }).notNull(),
    providerId: varchar("provider_id", { length: 60 }),
    sessionId: text("session_id").references(() => session.id),
    accountId: text("account_id").references(() => account.id),
    riskLevel: varchar("risk_level", { length: 20 }).default("LOW").notNull(),
    failureReason: text("failure_reason"),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: text("user_agent"),
    countryCode: varchar("country_code", { length: 10 }),
    sourceApp: varchar("source_app", { length: 30 }).notNull(),
    metadata: jsonb("metadata"),
    occurredAt: timestamp("occurred_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    userOccurredIdx: index("auth_audit_logs_user_occurred_idx").on(
      t.userId,
      t.occurredAt,
    ),
    eventOccurredIdx: index("auth_audit_logs_event_occurred_idx").on(
      t.eventType,
      t.occurredAt,
    ),
    statusOccurredIdx: index("auth_audit_logs_status_occurred_idx").on(
      t.eventStatus,
      t.occurredAt,
    ),
    riskOccurredIdx: index("auth_audit_logs_risk_occurred_idx").on(
      t.riskLevel,
      t.occurredAt,
    ),
  }),
);

export const adminActionApprovals = pgTable(
  "admin_action_approvals",
  {
    id: idColumn(),
    actionType: varchar("action_type", { length: 50 }).notNull(),
    targetEntityType: varchar("target_entity_type", { length: 60 }).notNull(),
    targetEntityId: text("target_entity_id"),
    requestedByUserId: text("requested_by_user_id")
      .references(() => user.id)
      .notNull(),
    requestedAt: timestamp("requested_at").defaultNow().notNull(),
    status: varchar("status", { length: 20 }).default("PENDING").notNull(),
    dedupeKey: varchar("dedupe_key", { length: 200 }).notNull(),
    approvedByUserId: text("approved_by_user_id").references(() => user.id),
    approvedAt: timestamp("approved_at"),
    rejectedByUserId: text("rejected_by_user_id").references(() => user.id),
    rejectedAt: timestamp("rejected_at"),
    expiresAt: timestamp("expires_at"),
    requestReason: text("request_reason"),
    decisionReason: text("decision_reason"),
    payloadJson: jsonb("payload_json"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (t) => ({
    pendingDedupeUniq: uniqueIndex("admin_action_approvals_pending_dedupe_uniq")
      .on(t.dedupeKey)
      .where(sql`${t.status} = 'PENDING'`),
    statusRequestedIdx: index("admin_action_approvals_status_requested_idx").on(
      t.status,
      t.requestedAt,
    ),
    requestedByStatusIdx: index(
      "admin_action_approvals_requested_by_status_idx",
    ).on(t.requestedByUserId, t.status),
  }),
);