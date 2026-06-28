export const activeBookingWorkflowStatuses = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "DOCS_PENDING",
  "DOCS_VERIFIED",
  "PAYMENT_PENDING",
  "PAYMENT_VERIFIED",
  "APPROVED",
  "LO_OBTAINED",
  "LO_SIGNED",
  "SPA_SIGNED",
  "SOLD",
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
  "SOLD",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
] as const;

export const unitStatusCodes = [
  "AVAILABLE",
  "RESERVED",
  "BOOKING",
  "APPROVED",
  "LO_OBTAINED",
  "LO_SIGNED",
  "SPA_SIGNED",
  "SOLD",
  "CANCELLED",
] as const;

export const unitStatusTransitionCandidates = {
  bookingCreated: ["BOOKING", "RESERVED"] as const,
  bookingApproved: ["APPROVED", "BOOKING", "RESERVED"] as const,
  loObtained: ["LO_OBTAINED"] as const,
  loSigned: ["LO_SIGNED"] as const,
  spaSigned: ["SPA_SIGNED"] as const,
  sold: ["SOLD"] as const,
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

export function isUnitLockedStatus(statusCode: string | null | undefined) {
  return (
    statusCode === "BOOKING" ||
    statusCode === "RESERVED" ||
    statusCode === "APPROVED" ||
    statusCode === "LO_OBTAINED" ||
    statusCode === "LO_SIGNED" ||
    statusCode === "SPA_SIGNED" ||
    statusCode === "SOLD"
  );
}

export function isUnitSoldStatus(statusCode: string | null | undefined) {
  return statusCode === "SPA_SIGNED" || statusCode === "SOLD";
}
