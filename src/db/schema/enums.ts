// src\db\schema\enums.ts
import { pgEnum } from "drizzle-orm/pg-core";

export const fileScanStatusEnum = pgEnum("file_scan_status", [
  "PENDING",
  "CLEAN",
  "INFECTED",
  "ERROR",
]);

export const fileVisibilityScopeEnum = pgEnum("file_visibility_scope", [
  "PUBLIC",
  "INTERNAL",
  "RESTRICTED",
]);

export const leadStatusEnum = pgEnum("lead_status", [
  "NEW",
  "UNCONTACTED",
  "ASSIGNED",
  "CONTACTED",
  "QUALIFIED",
  "NURTURING",
  "APPOINTMENT_SET",
  "LOST",
  "SPAM",
  "CLOSED",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "PAYMENT_PENDING",
  "PAYMENT_VERIFIED",
  "DOCS_PENDING",
  "DOCS_VERIFIED",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "RECEIVED",
  "VERIFIED",
  "REJECTED",
  "REFUNDED",
]);

export const documentRequestStatusEnum = pgEnum("document_request_status", [
  "REQUESTED",
  "SUBMITTED",
  "VERIFIED",
  "REJECTED",
  "WAIVED",
]);

export const documentSubmissionStatusEnum = pgEnum("document_submission_status", [
  "SUBMITTED",
  "UNDER_REVIEW",
  "VERIFIED",
  "REJECTED",
  "REPLACED",
]);

export const documentVerificationStatusEnum = pgEnum("document_verification_status", [
  "PENDING",
  "VERIFIED",
  "REJECTED",
]);

export const otpPurposeEnum = pgEnum("otp_purpose", [
  "LOGIN",
  "REGISTER",
  "PASSWORD_RESET",
]);

export const otpChannelEnum = pgEnum("otp_channel", [
  "SMS",
  "WHATSAPP",
  "DEV_CONSOLE",
]);

export const PROJECT_NEARBY_PLACE_CATEGORIES = [
  "SHOPPING",
  "EDUCATION",
  "HEALTHCARE",
  "TRANSPORT",
  "RECREATION",
  "POLICE",
  "OTHERS",
] as const;
