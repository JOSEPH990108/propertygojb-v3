import type { AppStatusBadgeTone } from "@/lib/bookings/format";

export function formatAppointmentStatus(value: string | null | undefined) {
  if (!value) return "Unknown";

  return value
    .split("_")
    .map((part) => part.slice(0, 1) + part.slice(1).toLowerCase())
    .join(" ");
}

export function getAppointmentStatusTone(
  value: string | null | undefined,
): AppStatusBadgeTone {
  switch (value) {
    case "COMPLETED":
      return "success";
    case "CANCELLED":
      return "danger";
    case "SCHEDULED":
      return "info";
    case "REQUESTED":
      return "warning";
    default:
      return "neutral";
  }
}
