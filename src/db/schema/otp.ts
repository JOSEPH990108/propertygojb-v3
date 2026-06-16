import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { otpChannelEnum, otpPurposeEnum } from "./enums";
import { user } from "./identity-auth";

const idColumn = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID());

export const otpChallenges = pgTable(
  "otp_challenges",
  {
    id: idColumn(),
    identifier: varchar("identifier", { length: 120 }).notNull(),
    phoneE164: varchar("phone_e164", { length: 20 }).notNull(),
    phoneNormalized: varchar("phone_normalized", { length: 20 }).notNull(),
    purpose: otpPurposeEnum("purpose").notNull(),
    channel: otpChannelEnum("channel").notNull(),
    otpHash: text("otp_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    consumedAt: timestamp("consumed_at"),
    verifiedAt: timestamp("verified_at"),
    lockedAt: timestamp("locked_at"),
    attemptCount: integer("attempt_count").default(0).notNull(),
    maxAttempts: integer("max_attempts").default(5).notNull(),
    resendAvailableAt: timestamp("resend_available_at").notNull(),
    lastSentAt: timestamp("last_sent_at"),
    sendCount: integer("send_count").default(0).notNull(),
    requestId: varchar("request_id", { length: 120 }),
    ipAddressHash: varchar("ip_address_hash", { length: 128 }),
    userAgentHash: varchar("user_agent_hash", { length: 128 }),
    userAgent: text("user_agent"),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (t) => ({
    phoneCreatedIdx: index("otp_challenges_phone_created_idx").on(
      t.phoneNormalized,
      t.createdAt,
    ),
    identifierCreatedIdx: index("otp_challenges_identifier_created_idx").on(
      t.identifier,
      t.createdAt,
    ),
    identifierUniq: uniqueIndex("otp_challenges_identifier_uniq").on(t.identifier),
    expiresAtIdx: index("otp_challenges_expires_at_idx").on(t.expiresAt),
    requestIdIdx: index("otp_challenges_request_id_idx").on(t.requestId),
    // Expired but unconsumed rows can still match this partial unique index.
    // Runtime flow must consume/lock/close expired active challenges before creating a new one.
    activePhonePurposeUniq: uniqueIndex("otp_challenges_active_phone_purpose_uniq")
      .on(t.phoneNormalized, t.purpose)
      .where(sql`${t.consumedAt} is null and ${t.lockedAt} is null`),
  }),
);
