export const activeBookingWorkflowStatuses = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "DOCS_PENDING",
  "DOCS_VERIFIED",
  "PAYMENT_PENDING",
  "PAYMENT_VERIFIED",
  "APPROVED",
] as const;

export const expirableBookingWorkflowStatuses = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "DOCS_PENDING",
  "DOCS_VERIFIED",
  "PAYMENT_PENDING",
  "PAYMENT_VERIFIED",
] as const;

export const inactiveBookingWorkflowStatuses = [
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
] as const;

export const terminalBookingWorkflowStatuses = [
  "APPROVED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
] as const;

export const unitStatusCodes = [
  "AVAILABLE",
  "RESERVED",
  "BOOKING",
  "APPROVED",
  "SPA_SIGNED",
  "SOLD",
  "CANCELLED",
] as const;

export const unitStatusTransitionCandidates = {
  bookingCreated: ["BOOKING", "RESERVED"] as const,
  bookingApproved: ["APPROVED", "SOLD", "RESERVED"] as const,
  bookingReleased: ["AVAILABLE"] as const,
};

export function isActiveBookingWorkflowStatus(status: string | null | undefined) {
  return activeBookingWorkflowStatuses.includes(
    status as (typeof activeBookingWorkflowStatuses)[number],
  );
}

export function isInactiveBookingWorkflowStatus(status: string | null | undefined) {
  return inactiveBookingWorkflowStatuses.includes(
    status as (typeof inactiveBookingWorkflowStatuses)[number],
  );
}

export function isUnitAvailableStatus(statusCode: string | null | undefined) {
  return statusCode === "AVAILABLE";
}

export function isUnitReservedStatus(statusCode: string | null | undefined) {
  return statusCode === "RESERVED" || statusCode === "BOOKING";
}

export function isUnitSoldStatus(statusCode: string | null | undefined) {
  return (
    statusCode === "APPROVED" ||
    statusCode === "SPA_SIGNED" ||
    statusCode === "SOLD"
  );
}
