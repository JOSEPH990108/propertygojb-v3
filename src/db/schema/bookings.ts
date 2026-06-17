import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { baseColumns } from "./base";
import { projects } from "./catalog";
import { bookingStatusEnum, paymentStatusEnum } from "./enums";
import { files } from "./files";
import { user } from "./identity-auth";
import { units } from "./inventory";
import { leads } from "./crm-leads";

export const bookings = pgTable(
  "bookings",
  {
    ...baseColumns(),
    leadId: text("lead_id")
      .references(() => leads.id)
      .notNull(),
    projectId: text("project_id")
      .references(() => projects.id)
      .notNull(),
    bookingCode: varchar("booking_code", { length: 50 }).notNull(),
    status: bookingStatusEnum("status").default("DRAFT").notNull(),
    bookingChannel: varchar("booking_channel", { length: 30 }).notNull(),
    submittedByUserId: text("submitted_by_user_id").references(() => user.id),
    assignedAgentUserId: text("assigned_agent_user_id").references(() => user.id),
    bookingFeeAmount: decimal("booking_fee_amount", { precision: 15, scale: 2 }),
    bookingFeeCurrency: varchar("booking_fee_currency", { length: 10 })
      .default("MYR")
      .notNull(),
    bookingFeePaidAmount: decimal("booking_fee_paid_amount", {
      precision: 15,
      scale: 2,
    })
      .default("0.00")
      .notNull(),
    bookingFeeDueAt: timestamp("booking_fee_due_at"),
    submittedAt: timestamp("submitted_at"),
    approvedAt: timestamp("approved_at"),
    approvedByUserId: text("approved_by_user_id").references(() => user.id),
    rejectedAt: timestamp("rejected_at"),
    rejectedByUserId: text("rejected_by_user_id").references(() => user.id),
    rejectionReason: text("rejection_reason"),
    expiredAt: timestamp("expired_at"),
    cancelledAt: timestamp("cancelled_at"),
    cancellationReason: text("cancellation_reason"),
    metadata: jsonb("metadata"),
  },
  (t) => ({
    bookingCodeUniq: unique().on(t.bookingCode),
    statusCreatedIdx: index("bookings_status_created_idx").on(t.status, t.createdAt),
    leadCreatedIdx: index("bookings_lead_created_idx").on(t.leadId, t.createdAt),
    projectStatusIdx: index("bookings_project_status_idx").on(
      t.projectId,
      t.status,
    ),
    assignedStatusIdx: index("bookings_assigned_status_idx").on(
      t.assignedAgentUserId,
      t.status,
    ),
  }),
);

export const bookingUnits = pgTable(
  "booking_units",
  {
    ...baseColumns(),
    bookingId: text("booking_id")
      .references(() => bookings.id)
      .notNull(),
    projectId: text("project_id")
      .references(() => projects.id)
      .notNull(),
    unitId: text("unit_id")
      .references(() => units.id)
      .notNull(),
    reservedPrice: decimal("reserved_price", { precision: 15, scale: 2 }),
    bookingFeeAllocatedAmount: decimal("booking_fee_allocated_amount", {
      precision: 15,
      scale: 2,
    }),
    reservationStartedAt: timestamp("reservation_started_at"),
    reservationExpiresAt: timestamp("reservation_expires_at"),
    releasedAt: timestamp("released_at"),
    releaseReason: text("release_reason"),
  },
  (t) => ({
    oneUnitPerBookingUniq: unique().on(t.bookingId),
    unitIdx: index("booking_units_unit_idx").on(t.unitId),
    bookingExpiryIdx: index("booking_units_booking_expiry_idx").on(
      t.bookingId,
      t.reservationExpiresAt,
    ),
  }),
);

export const bookingParticipants = pgTable(
  "booking_participants",
  {
    ...baseColumns(),
    bookingId: text("booking_id")
      .references(() => bookings.id)
      .notNull(),
    role: varchar("role", { length: 30 }).notNull(),
    fullName: varchar("full_name", { length: 200 }).notNull(),
    phoneE164: varchar("phone_e164", { length: 30 }),
    email: varchar("email", { length: 255 }),
    nationality: varchar("nationality", { length: 100 }),
    identityType: varchar("identity_type", { length: 30 }),
    identityNoMasked: varchar("identity_no_masked", { length: 60 }),
    isPrimaryContact: boolean("is_primary_contact").default(false).notNull(),
    isSignatory: boolean("is_signatory").default(false).notNull(),
    participantOrder: integer("participant_order").default(0).notNull(),
  },
  (t) => ({
    bookingOrderUniq: unique().on(t.bookingId, t.participantOrder),
    bookingRoleIdx: index("booking_participants_booking_role_idx").on(
      t.bookingId,
      t.role,
    ),
  }),
);

export const bookingStatusHistory = pgTable(
  "booking_status_history",
  {
    ...baseColumns(),
    bookingId: text("booking_id")
      .references(() => bookings.id)
      .notNull(),
    fromStatus: bookingStatusEnum("from_status"),
    toStatus: bookingStatusEnum("to_status").notNull(),
    changedByUserId: text("changed_by_user_id").references(() => user.id),
    changedAt: timestamp("changed_at").defaultNow().notNull(),
    reasonCode: varchar("reason_code", { length: 50 }),
    reasonNote: text("reason_note"),
    sourceEventType: varchar("source_event_type", { length: 40 }),
  },
  (t) => ({
    bookingChangedAtIdx: index("booking_status_history_booking_changed_at_idx").on(
      t.bookingId,
      t.changedAt,
    ),
  }),
);

export const bookingPayments = pgTable(
  "booking_payments",
  {
    ...baseColumns(),
    bookingId: text("booking_id")
      .references(() => bookings.id)
      .notNull(),
    paymentType: varchar("payment_type", { length: 30 }).notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).default("MYR").notNull(),
    paymentMethod: varchar("payment_method", { length: 30 }),
    paymentStatus: paymentStatusEnum("payment_status").notNull(),
    receivedAt: timestamp("received_at"),
    verifiedAt: timestamp("verified_at"),
    verifiedByUserId: text("verified_by_user_id").references(() => user.id),
    referenceNo: varchar("reference_no", { length: 120 }),
    proofFileId: text("proof_file_id").references(() => files.id),
    rejectionReason: text("rejection_reason"),
    reasonCode: varchar("reason_code", { length: 50 }),
    reasonNote: text("reason_note"),
    metadata: jsonb("metadata"),
  },
  (t) => ({
    bookingStatusIdx: index("booking_payments_booking_status_idx").on(
      t.bookingId,
      t.paymentStatus,
    ),
    referenceNoIdx: index("booking_payments_reference_no_idx").on(t.referenceNo),
  }),
);

export const bookingActivities = pgTable(
  "booking_activities",
  {
    ...baseColumns(),
    bookingId: text("booking_id")
      .references(() => bookings.id)
      .notNull(),
    actorUserId: text("actor_user_id").references(() => user.id),
    activityType: varchar("activity_type", { length: 40 }).notNull(),
    title: varchar("title", { length: 150 }),
    body: text("body"),
    visibilityScope: varchar("visibility_scope", { length: 20 })
      .default("INTERNAL")
      .notNull(),
    activityAt: timestamp("activity_at").defaultNow().notNull(),
    metadata: jsonb("metadata"),
  },
  (t) => ({
    bookingActivityAtIdx: index("booking_activities_booking_activity_at_idx").on(
      t.bookingId,
      t.activityAt,
    ),
  }),
);
