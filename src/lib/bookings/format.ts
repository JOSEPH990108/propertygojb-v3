export type AppStatusBadgeTone =
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "neutral";

export function formatBookingStatus(value: string | null | undefined) {
  if (!value) {
    return "Unknown";
  }

  return value
    .split("_")
    .map((part) => part.slice(0, 1) + part.slice(1).toLowerCase())
    .join(" ");
}

export function getBookingStatusTone(
  value: string | null | undefined,
): AppStatusBadgeTone {
  switch (value) {
    case "APPROVED":
    case "PAYMENT_VERIFIED":
    case "DOCS_VERIFIED":
      return "success";

    case "REJECTED":
    case "EXPIRED":
    case "CANCELLED":
      return "danger";

    case "DRAFT":
    case "SUBMITTED":
    case "PAYMENT_PENDING":
    case "DOCS_PENDING":
      return "warning";

    case "UNDER_REVIEW":
      return "info";

    default:
      return "neutral";
  }
}

export function getPaymentStatusTone(
  value: string | null | undefined,
): AppStatusBadgeTone {
  switch (value) {
    case "VERIFIED":
    case "RECEIVED":
      return "success";

    case "REJECTED":
      return "danger";

    case "PENDING":
      return "warning";

    case "REFUNDED":
      return "info";

    default:
      return "neutral";
  }
}

export function formatDateTime(value: Date | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function formatMoney(
  amount: string | number | null | undefined,
  currency = "MYR",
) {
  if (amount === null || amount === undefined || amount === "") {
    return "-";
  }

  const numericAmount = Number(amount);

  if (Number.isNaN(numericAmount)) {
    return `${currency} ${amount}`;
  }

  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(numericAmount);
}
