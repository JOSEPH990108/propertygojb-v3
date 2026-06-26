import { NextRequest } from "next/server";

import { requireRole } from "@/lib/auth/guards";
import { formatBookingStatus, formatDateTime, formatMoney } from "@/lib/bookings/format";
import { getReportOverview } from "@/lib/reports/overview";

type ReportPortal = "admin" | "agent";

function parsePortal(value: string | null): ReportPortal {
  return value === "agent" ? "agent" : "admin";
}

function parseStartDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseEndDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatStatus(value: string | null | undefined) {
  if (!value) {
    return "Unknown";
  }

  return value
    .split("_")
    .map((part) => part.slice(0, 1) + part.slice(1).toLowerCase())
    .join(" ");
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function csvRow(values: unknown[]) {
  return values.map(csvCell).join(",");
}

function getFileName({
  portal,
  from,
  to,
}: {
  portal: ReportPortal;
  from: string | null;
  to: string | null;
}) {
  const range = from || to ? `${from || "start"}-to-${to || "today"}` : "all-time";
  return `${portal}-report-${range}.csv`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const portal = parsePortal(searchParams.get("portal"));
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const authContext =
    portal === "admin"
      ? await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/reports")
      : await requireRole(["AGENT", "SUPER_ADMIN"], "/agent/reports");

  const currentUser = authContext.user as { id?: unknown };
  const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";
  const canSeeAll = authContext.roleCode === "SUPER_ADMIN" || portal === "admin";

  const report = await getReportOverview({
    portal,
    currentUserId,
    canSeeAll,
    dateFrom: parseStartDate(from),
    dateTo: parseEndDate(to),
  });

  const rows: string[] = [];

  rows.push(csvRow(["PropertyGoJB Report Export"]));
  rows.push(csvRow(["Portal", portal]));
  rows.push(csvRow(["From", from || ""]));
  rows.push(csvRow(["To", to || ""]));
  rows.push(csvRow(["Generated At", new Date().toISOString()]));
  rows.push("");

  rows.push(csvRow(["Summary"]));
  rows.push(csvRow(["Metric", "Value"]));
  rows.push(csvRow(["Total Leads", report.leads.total]));
  rows.push(csvRow(["New / Uncontacted Leads", report.leads.new]));
  rows.push(csvRow(["Active Leads", report.leads.active]));
  rows.push(csvRow(["Qualified Leads", report.leads.qualified]));
  rows.push(csvRow(["Lost / Spam Leads", report.leads.lost]));
  rows.push(csvRow(["Lead Conversion Rate", `${report.leads.conversionRate}%`]));
  rows.push(csvRow(["Total Bookings", report.bookings.total]));
  rows.push(csvRow(["Active Bookings", report.bookings.active]));
  rows.push(csvRow(["Approved Bookings", report.bookings.approved]));
  rows.push(csvRow(["Payment Pending Bookings", report.bookings.paymentPending]));
  rows.push(csvRow(["Payment Verified Bookings", report.bookings.paymentVerified]));
  rows.push(csvRow(["Docs Pending Bookings", report.bookings.docsPending]));
  rows.push(csvRow(["Inactive Bookings", report.bookings.inactive]));
  rows.push(csvRow(["Payment Collected", formatMoney(report.bookings.paymentCollected, report.bookings.currency)]));
  rows.push(csvRow(["Booking Fee Total", formatMoney(report.bookings.bookingFeeTotal, report.bookings.currency)]));
  rows.push(csvRow(["Document Requests", report.documents.total]));
  rows.push(csvRow(["Documents Requested", report.documents.requested]));
  rows.push(csvRow(["Documents Submitted", report.documents.submitted]));
  rows.push(csvRow(["Documents Verified", report.documents.verified]));
  rows.push(csvRow(["Documents Rejected", report.documents.rejected]));
  rows.push(csvRow(["Documents Waived", report.documents.waived]));
  rows.push(csvRow(["Appointments", report.appointments.total]));
  rows.push(csvRow(["Pending Appointments", report.appointments.pending]));
  rows.push(csvRow(["Completed Appointments", report.appointments.completed]));
  rows.push("");

  rows.push(csvRow(["Latest Bookings"]));
  rows.push(
    csvRow([
      "Booking Code",
      "Customer",
      "Project",
      "Status",
      "Booking Fee",
      "Paid Amount",
      "Created At",
    ]),
  );

  for (const booking of report.bookings.latest) {
    rows.push(
      csvRow([
        booking.bookingCode,
        booking.customerName ?? booking.customerPhone ?? "Customer",
        booking.projectDisplayName ?? booking.projectName ?? "Project",
        formatBookingStatus(booking.status),
        formatMoney(booking.bookingFeeAmount, booking.bookingFeeCurrency),
        formatMoney(booking.bookingFeePaidAmount, booking.bookingFeeCurrency),
        formatDateTime(booking.createdAt),
      ]),
    );
  }

  rows.push("");

  rows.push(csvRow(["Latest Document Requests"]));
  rows.push(
    csvRow([
      "Document Type",
      "Customer",
      "Booking Code",
      "Project",
      "Request Status",
      "Requested At",
      "Due At",
    ]),
  );

  for (const document of report.documents.latest) {
    rows.push(
      csvRow([
        document.documentTypeName,
        document.customerName ?? "Customer",
        document.bookingCode,
        document.projectDisplayName ?? document.projectName ?? "Project",
        formatStatus(document.requestStatus),
        formatDateTime(document.requestedAt),
        formatDateTime(document.dueAt),
      ]),
    );
  }

  rows.push("");

  rows.push(csvRow(["Latest Appointment Activities"]));
  rows.push(csvRow(["Title", "Customer", "Due At", "Completed At", "Created At"]));

  for (const appointment of report.appointments.latest) {
    rows.push(
      csvRow([
        appointment.title ?? "Viewing Appointment",
        appointment.customerName ?? appointment.customerPhone ?? "Customer",
        formatDateTime(appointment.dueAt),
        formatDateTime(appointment.completedAt),
        formatDateTime(appointment.createdAt),
      ]),
    );
  }

  const csv = rows.join("\n");
  const fileName = getFileName({ portal, from, to });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
