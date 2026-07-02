import { NextRequest } from "next/server";

import { and, desc, eq, isNull } from "drizzle-orm";

import { db, schema } from "@/db";
import { requireRole } from "@/lib/auth/guards";
import {
  formatBookingStatus,
  formatDateTime,
  formatMoney,
} from "@/lib/bookings/format";

type BookingPortal = "admin" | "agent";

function parsePortal(value: string | null): BookingPortal {
  return value === "agent" ? "agent" : "admin";
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function csvRow(values: unknown[]) {
  return values.map(csvCell).join(",");
}

function getCustomerName(row: {
  customerName: string | null;
  customerPhone: string | null;
}) {
  return row.customerName ?? row.customerPhone ?? "Customer";
}

function getProjectName(row: {
  projectDisplayName: string | null;
  projectName: string | null;
}) {
  return row.projectDisplayName ?? row.projectName ?? "Project";
}

function getFileName(portal: BookingPortal) {
  const date = new Date().toISOString().slice(0, 10);
  return `${portal}-bookings-${date}.csv`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const portal = parsePortal(searchParams.get("portal"));

  const authContext =
    portal === "admin"
      ? await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/bookings")
      : await requireRole(["AGENT", "SUPER_ADMIN"], "/agent/bookings");

  const currentUser = authContext.user as { id?: unknown };
  const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";
  const canSeeAll = authContext.roleCode === "SUPER_ADMIN" || portal === "admin";

  const bookings = await db
    .select({
      bookingId: schema.bookings.id,
      bookingCode: schema.bookings.bookingCode,
      status: schema.bookings.status,
      bookingChannel: schema.bookings.bookingChannel,
      bookingFeeAmount: schema.bookings.bookingFeeAmount,
      bookingFeeCurrency: schema.bookings.bookingFeeCurrency,
      bookingFeePaidAmount: schema.bookings.bookingFeePaidAmount,
      submittedAt: schema.bookings.submittedAt,
      approvedAt: schema.bookings.approvedAt,
      rejectedAt: schema.bookings.rejectedAt,
      cancelledAt: schema.bookings.cancelledAt,
      createdAt: schema.bookings.createdAt,

      customerName: schema.leads.fullName,
      customerPhone: schema.leads.primaryPhoneE164,
      customerEmail: schema.leads.email,

      projectName: schema.projects.name,
      projectDisplayName: schema.projects.displayName,

      unitNo: schema.units.unitNo,

      agentName: schema.user.name,
      agentEmail: schema.user.email,
    })
    .from(schema.bookings)
    .leftJoin(schema.leads, eq(schema.bookings.leadId, schema.leads.id))
    .leftJoin(schema.projects, eq(schema.bookings.projectId, schema.projects.id))
    .leftJoin(
      schema.bookingUnits,
      eq(schema.bookings.id, schema.bookingUnits.bookingId),
    )
    .leftJoin(schema.units, eq(schema.bookingUnits.unitId, schema.units.id))
    .leftJoin(schema.user, eq(schema.bookings.assignedAgentUserId, schema.user.id))
    .where(
      and(
        isNull(schema.bookings.deletedAt),
        canSeeAll
          ? undefined
          : eq(schema.bookings.assignedAgentUserId, currentUserId),
      ),
    )
    .orderBy(desc(schema.bookings.createdAt))
    .limit(2000);

  const rows: string[] = [];

  rows.push(csvRow(["PropertyGoJB Booking Export"]));
  rows.push(csvRow(["Portal", portal]));
  rows.push(csvRow(["Generated At", new Date().toISOString()]));
  rows.push("");

  rows.push(
    csvRow([
      "Booking Code",
      "Status",
      "Channel",
      "Customer",
      "Customer Phone",
      "Customer Email",
      "Project",
      "Unit No",
      "Agent",
      "Agent Email",
      "Booking Fee",
      "Paid Amount",
      "Outstanding Amount",
      "Created At",
      "Submitted At",
      "Approved At",
      "Rejected At",
      "Cancelled At",
    ]),
  );

  for (const booking of bookings) {
    const bookingFee = Number(booking.bookingFeeAmount ?? 0);
    const paidAmount = Number(booking.bookingFeePaidAmount ?? 0);
    const outstandingAmount = Math.max(bookingFee - paidAmount, 0);

    rows.push(
      csvRow([
        booking.bookingCode,
        formatBookingStatus(booking.status),
        booking.bookingChannel ?? "",
        getCustomerName(booking),
        booking.customerPhone ?? "",
        booking.customerEmail ?? "",
        getProjectName(booking),
        booking.unitNo ?? "",
        booking.agentName ?? "Unassigned",
        booking.agentEmail ?? "",
        formatMoney(booking.bookingFeeAmount, booking.bookingFeeCurrency),
        formatMoney(booking.bookingFeePaidAmount, booking.bookingFeeCurrency),
        formatMoney(outstandingAmount, booking.bookingFeeCurrency),
        formatDateTime(booking.createdAt),
        formatDateTime(booking.submittedAt),
        formatDateTime(booking.approvedAt),
        formatDateTime(booking.rejectedAt),
        formatDateTime(booking.cancelledAt),
      ]),
    );
  }

  const csv = rows.join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${getFileName(portal)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
