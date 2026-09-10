import { NextRequest } from "next/server";

import { and, desc, eq, ilike, inArray, isNull, or } from "drizzle-orm";

import { db, schema } from "@/db";
import { requireRole } from "@/lib/auth/guards";
import {
  formatBookingStatus,
  formatDateTime,
  formatMoney,
} from "@/lib/bookings/format";

type CustomerPortal = "admin" | "agent";

function parsePortal(value: string | null): CustomerPortal {
  return value === "agent" ? "agent" : "admin";
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function csvRow(values: unknown[]) {
  return values.map(csvCell).join(",");
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

function getCustomerName(customer: {
  fullName: string | null;
  phoneE164: string | null;
  phoneNormalized: string | null;
}) {
  return (
    customer.fullName ??
    customer.phoneE164 ??
    customer.phoneNormalized ??
    "Customer"
  );
}

function getProjectName(booking: {
  projectDisplayName: string | null;
  projectName: string | null;
}) {
  return booking.projectDisplayName ?? booking.projectName ?? "Project";
}

function getFileName(portal: CustomerPortal) {
  const date = new Date().toISOString().slice(0, 10);
  return `${portal}-customers-${date}.csv`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const portal = parsePortal(searchParams.get("portal"));
  const search = (searchParams.get("q") ?? "").trim();
  const searchPattern = `%${search}%`;

  const authContext =
    portal === "admin"
      ? await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/customers")
      : await requireRole(["AGENT", "SUPER_ADMIN"], "/agent/customers");

  const currentUser = authContext.user as { id?: unknown };
  const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";
  const canSeeAll = authContext.roleCode === "SUPER_ADMIN" || portal === "admin";

  const customers = await db
    .select({
      id: schema.leads.id,
      fullName: schema.leads.fullName,
      phoneNormalized: schema.leads.primaryPhoneNormalized,
      phoneE164: schema.leads.primaryPhoneE164,
      email: schema.leads.email,
      currentStatus: schema.leads.currentStatus,
      firstInquiryAt: schema.leads.firstInquiryAt,
      lastActivityAt: schema.leads.lastActivityAt,
      createdAt: schema.leads.createdAt,
      sourceName: schema.leadSources.name,
      assigneeName: schema.user.name,
      assigneeEmail: schema.user.email,
      currentAssigneeUserId: schema.leads.currentAssigneeUserId,
    })
    .from(schema.leads)
    .leftJoin(schema.leadSources, eq(schema.leads.sourceId, schema.leadSources.id))
    .leftJoin(schema.user, eq(schema.leads.currentAssigneeUserId, schema.user.id))
    .where(
      and(
        isNull(schema.leads.deletedAt),
        canSeeAll ? undefined : eq(schema.leads.currentAssigneeUserId, currentUserId),
        search
          ? or(
              ilike(schema.leads.fullName, searchPattern),
              ilike(schema.leads.primaryPhoneNormalized, searchPattern),
              ilike(schema.leads.primaryPhoneE164, searchPattern),
              ilike(schema.leads.email, searchPattern),
              ilike(schema.user.name, searchPattern),
            )
          : undefined,
      ),
    )
    .orderBy(desc(schema.leads.lastActivityAt), desc(schema.leads.createdAt))
    .limit(1000);

  const customerIds = customers.map((customer) => customer.id);

  const bookings =
    customerIds.length > 0
      ? await db
          .select({
            id: schema.bookings.id,
            leadId: schema.bookings.leadId,
            bookingCode: schema.bookings.bookingCode,
            status: schema.bookings.status,
            bookingFeeAmount: schema.bookings.bookingFeeAmount,
            bookingFeeCurrency: schema.bookings.bookingFeeCurrency,
            bookingFeePaidAmount: schema.bookings.bookingFeePaidAmount,
            createdAt: schema.bookings.createdAt,
            projectName: schema.projects.name,
            projectDisplayName: schema.projects.displayName,
          })
          .from(schema.bookings)
          .leftJoin(schema.projects, eq(schema.bookings.projectId, schema.projects.id))
          .where(
            and(
              inArray(schema.bookings.leadId, customerIds),
              isNull(schema.bookings.deletedAt),
              canSeeAll
                ? undefined
                : eq(schema.bookings.assignedAgentUserId, currentUserId),
            ),
          )
          .orderBy(desc(schema.bookings.createdAt))
      : [];

  const bookingsByLeadId = new Map<string, typeof bookings>();

  for (const booking of bookings) {
    const existing = bookingsByLeadId.get(booking.leadId) ?? [];
    existing.push(booking);
    bookingsByLeadId.set(booking.leadId, existing);
  }

  const rows: string[] = [];

  rows.push(csvRow(["PropertyGoJB Customer Export"]));
  rows.push(csvRow(["Portal", portal]));
  rows.push(csvRow(["Search", search]));
  rows.push(csvRow(["Generated At", new Date().toISOString()]));
  rows.push("");

  rows.push(
    csvRow([
      "Customer Name",
      "Phone",
      "Email",
      "Lead Status",
      "Source",
      "Assignee",
      "Assignee Email",
      "First Inquiry At",
      "Last Activity At",
      "Latest Booking Code",
      "Latest Booking Status",
      "Latest Booking Project",
      "Booking Fee",
      "Paid Amount",
      "Total Bookings",
    ]),
  );

  for (const customer of customers) {
    const customerBookings = bookingsByLeadId.get(customer.id) ?? [];
    const latestBooking = customerBookings[0];

    rows.push(
      csvRow([
        getCustomerName(customer),
        customer.phoneE164 ?? customer.phoneNormalized ?? "",
        customer.email ?? "",
        formatStatus(customer.currentStatus),
        customer.sourceName ?? "",
        customer.assigneeName ?? "Unassigned",
        customer.assigneeEmail ?? "",
        formatDateTime(customer.firstInquiryAt ?? customer.createdAt),
        formatDateTime(customer.lastActivityAt ?? customer.createdAt),
        latestBooking?.bookingCode ?? "",
        latestBooking ? formatBookingStatus(latestBooking.status) : "",
        latestBooking ? getProjectName(latestBooking) : "",
        latestBooking
          ? formatMoney(
              latestBooking.bookingFeeAmount,
              latestBooking.bookingFeeCurrency,
            )
          : "",
        latestBooking
          ? formatMoney(
              latestBooking.bookingFeePaidAmount,
              latestBooking.bookingFeeCurrency,
            )
          : "",
        customerBookings.length,
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
