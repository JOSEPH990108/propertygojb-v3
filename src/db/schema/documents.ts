import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
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
  bookingParticipants,
  bookings,
} from "./bookings";
import {
  documentRequestStatusEnum,
  documentSubmissionStatusEnum,
  documentVerificationStatusEnum,
} from "./enums";
import { files } from "./files";
import { user } from "./identity-auth";

export const documentTypes = pgTable(
  "document_types",
  {
    ...baseColumns(),
    code: varchar("code", { length: 50 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 40 }).notNull(),
    allowedMimePatterns: jsonb("allowed_mime_patterns"),
    maxFileSizeBytes: integer("max_file_size_bytes"),
    isMandatoryDefault: boolean("is_mandatory_default").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (t) => ({
    codeUniq: unique().on(t.code),
    activeCategoryIdx: index("document_types_active_category_idx").on(
      t.isActive,
      t.category,
    ),
  }),
);

export const documentRequests = pgTable(
  "document_requests",
  {
    ...baseColumns(),
    bookingId: text("booking_id")
      .references(() => bookings.id)
      .notNull(),
    participantId: text("participant_id").references(() => bookingParticipants.id),
    documentTypeId: text("document_type_id")
      .references(() => documentTypes.id)
      .notNull(),
    requestStatus: documentRequestStatusEnum("request_status").notNull(),
    requestedByUserId: text("requested_by_user_id").references(() => user.id),
    requestedAt: timestamp("requested_at").defaultNow().notNull(),
    dueAt: timestamp("due_at"),
    waivedAt: timestamp("waived_at"),
    waivedByUserId: text("waived_by_user_id").references(() => user.id),
    waiveReason: text("waive_reason"),
    notes: text("notes"),
  },
  (t) => ({
    bookingRequestStatusIdx: index("document_requests_booking_status_idx").on(
      t.bookingId,
      t.requestStatus,
    ),
    participantRequestStatusIdx: index(
      "document_requests_participant_status_idx",
    ).on(t.participantId, t.requestStatus),
    participantOpenUniq: uniqueIndex("document_requests_participant_open_uniq")
      .on(t.bookingId, t.participantId, t.documentTypeId)
      .where(
        sql`${t.participantId} is not null and ${t.requestStatus} != 'WAIVED'`,
      ),
    bookingOpenUniq: uniqueIndex("document_requests_booking_open_uniq")
      .on(t.bookingId, t.documentTypeId)
      .where(
        sql`${t.participantId} is null and ${t.requestStatus} != 'WAIVED'`,
      ),
  }),
);

export const documentSubmissions = pgTable(
  "document_submissions",
  {
    ...baseColumns(),
    bookingId: text("booking_id")
      .references(() => bookings.id)
      .notNull(),
    requestId: text("request_id").references(() => documentRequests.id),
    participantId: text("participant_id").references(() => bookingParticipants.id),
    documentTypeId: text("document_type_id")
      .references(() => documentTypes.id)
      .notNull(),
    fileId: text("file_id")
      .references(() => files.id)
      .notNull(),
    submissionStatus: documentSubmissionStatusEnum("submission_status").notNull(),
    uploadedByUserId: text("uploaded_by_user_id").references(() => user.id),
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
    versionNo: integer("version_no").default(1).notNull(),
    replacedBySubmissionId: text("replaced_by_submission_id").references(
      (): AnyPgColumn => documentSubmissions.id,
      { onDelete: "set null" },
    ),
    notes: text("notes"),
  },
  (t) => ({
    bookingSubmissionStatusIdx: index("document_submissions_booking_status_idx").on(
      t.bookingId,
      t.submissionStatus,
    ),
    requestVersionIdx: index("document_submissions_request_version_idx").on(
      t.requestId,
      t.versionNo,
    ),
    fileIdIdx: index("document_submissions_file_id_idx").on(t.fileId),
    requestVersionUniq: uniqueIndex("document_submissions_request_version_uniq")
      .on(t.requestId, t.versionNo)
      .where(sql`${t.requestId} is not null`),
  }),
);

export const documentVerificationLogs = pgTable(
  "document_verification_logs",
  {
    ...baseColumns(),
    submissionId: text("submission_id")
      .references(() => documentSubmissions.id)
      .notNull(),
    bookingId: text("booking_id")
      .references(() => bookings.id)
      .notNull(),
    verificationStatus: documentVerificationStatusEnum("verification_status").notNull(),
    verifiedByUserId: text("verified_by_user_id").references(() => user.id),
    verifiedAt: timestamp("verified_at"),
    reasonCode: varchar("reason_code", { length: 50 }),
    reasonNote: text("reason_note"),
    checklistJson: jsonb("checklist_json"),
  },
  (t) => ({
    submissionCreatedIdx: index("document_verification_logs_submission_created_idx").on(
      t.submissionId,
      t.createdAt,
    ),
  }),
);

export const documentAccessLogs = pgTable(
  "document_access_logs",
  {
    ...baseColumns(),
    submissionId: text("submission_id")
      .references(() => documentSubmissions.id)
      .notNull(),
    bookingId: text("booking_id")
      .references(() => bookings.id)
      .notNull(),
    actorUserId: text("actor_user_id").references(() => user.id),
    accessType: varchar("access_type", { length: 30 }).notNull(),
    accessAt: timestamp("access_at").defaultNow().notNull(),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: text("user_agent"),
    sourceContext: varchar("source_context", { length: 50 }),
  },
  (t) => ({
    submissionAccessAtIdx: index("document_access_logs_submission_access_at_idx").on(
      t.submissionId,
      t.accessAt,
    ),
    bookingAccessAtIdx: index("document_access_logs_booking_access_at_idx").on(
      t.bookingId,
      t.accessAt,
    ),
  }),
);
