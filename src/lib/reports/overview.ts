import "server-only";

import { and, desc, eq, gte, isNull, lte } from "drizzle-orm";

import { db, schema } from "@/db";

type ReportPortal = "admin" | "agent";

type GetReportOverviewOptions = {
  portal: ReportPortal;
  currentUserId: string;
  canSeeAll: boolean;
  dateFrom?: Date | null;
  dateTo?: Date | null;
};

function toNumber(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isNaN(amount) ? 0 : amount;
}

function countByStatus<T extends { status: string | null }>(
  items: T[],
  statuses: string[],
) {
  return items.filter((item) => statuses.includes(item.status ?? "")).length;
}

function countByRequestStatus<T extends { requestStatus: string | null }>(
  items: T[],
  statuses: string[],
) {
  return items.filter((item) => statuses.includes(item.requestStatus ?? ""))
    .length;
}

export async function getReportOverview({
  portal,
  currentUserId,
  canSeeAll,
  dateFrom,
  dateTo,
}: GetReportOverviewOptions) {
  const canViewAll = portal === "admin" || canSeeAll;

  const [leads, bookings, documentRequests, appointmentActivities] =
    await Promise.all([
      db
        .select({
          id: schema.leads.id,
          fullName: schema.leads.fullName,
          phone: schema.leads.primaryPhoneE164,
          status: schema.leads.currentStatus,
          currentAssigneeUserId: schema.leads.currentAssigneeUserId,
          createdAt: schema.leads.createdAt,
          lastActivityAt: schema.leads.lastActivityAt,
        })
        .from(schema.leads)
        .where(
          and(
            isNull(schema.leads.deletedAt),
            dateFrom ? gte(schema.leads.createdAt, dateFrom) : undefined,
            dateTo ? lte(schema.leads.createdAt, dateTo) : undefined,
            canViewAll
              ? undefined
              : eq(schema.leads.currentAssigneeUserId, currentUserId),
          ),
        )
        .orderBy(desc(schema.leads.createdAt)),

      db
        .select({
          id: schema.bookings.id,
          leadId: schema.bookings.leadId,
          bookingCode: schema.bookings.bookingCode,
          status: schema.bookings.status,
          bookingFeeAmount: schema.bookings.bookingFeeAmount,
          bookingFeePaidAmount: schema.bookings.bookingFeePaidAmount,
          bookingFeeCurrency: schema.bookings.bookingFeeCurrency,
          assignedAgentUserId: schema.bookings.assignedAgentUserId,
          createdAt: schema.bookings.createdAt,
          projectName: schema.projects.name,
          projectDisplayName: schema.projects.displayName,
          customerName: schema.leads.fullName,
          customerPhone: schema.leads.primaryPhoneE164,
        })
        .from(schema.bookings)
        .leftJoin(schema.projects, eq(schema.bookings.projectId, schema.projects.id))
        .leftJoin(schema.leads, eq(schema.bookings.leadId, schema.leads.id))
        .where(
          and(
            isNull(schema.bookings.deletedAt),
            dateFrom ? gte(schema.bookings.createdAt, dateFrom) : undefined,
            dateTo ? lte(schema.bookings.createdAt, dateTo) : undefined,
            canViewAll
              ? undefined
              : eq(schema.bookings.assignedAgentUserId, currentUserId),
          ),
        )
        .orderBy(desc(schema.bookings.createdAt)),

      db
        .select({
          id: schema.documentRequests.id,
          requestStatus: schema.documentRequests.requestStatus,
          requestedAt: schema.documentRequests.requestedAt,
          dueAt: schema.documentRequests.dueAt,
          bookingId: schema.bookings.id,
          bookingCode: schema.bookings.bookingCode,
          assignedAgentUserId: schema.bookings.assignedAgentUserId,
          documentTypeName: schema.documentTypes.name,
          customerName: schema.leads.fullName,
          projectName: schema.projects.name,
          projectDisplayName: schema.projects.displayName,
        })
        .from(schema.documentRequests)
        .innerJoin(
          schema.documentTypes,
          eq(schema.documentRequests.documentTypeId, schema.documentTypes.id),
        )
        .innerJoin(schema.bookings, eq(schema.documentRequests.bookingId, schema.bookings.id))
        .leftJoin(schema.leads, eq(schema.bookings.leadId, schema.leads.id))
        .leftJoin(schema.projects, eq(schema.bookings.projectId, schema.projects.id))
        .where(
          and(
            isNull(schema.documentRequests.deletedAt),
            isNull(schema.bookings.deletedAt),
            dateFrom ? gte(schema.bookings.createdAt, dateFrom) : undefined,
            dateTo ? lte(schema.bookings.createdAt, dateTo) : undefined,
            canViewAll
              ? undefined
              : eq(schema.bookings.assignedAgentUserId, currentUserId),
          ),
        )
        .orderBy(desc(schema.documentRequests.requestedAt)),

      db
        .select({
          id: schema.leadActivities.id,
          leadId: schema.leadActivities.leadId,
          title: schema.leadActivities.title,
          body: schema.leadActivities.body,
          activityType: schema.leadActivities.activityType,
          dueAt: schema.leadActivities.dueAt,
          completedAt: schema.leadActivities.completedAt,
          createdAt: schema.leadActivities.createdAt,
          customerName: schema.leads.fullName,
          customerPhone: schema.leads.primaryPhoneE164,
          currentAssigneeUserId: schema.leads.currentAssigneeUserId,
        })
        .from(schema.leadActivities)
        .innerJoin(schema.leads, eq(schema.leadActivities.leadId, schema.leads.id))
        .where(
          and(
            isNull(schema.leadActivities.deletedAt),
            eq(schema.leadActivities.activityType, "VIEWING_APPOINTMENT"),
            dateFrom ? gte(schema.leadActivities.createdAt, dateFrom) : undefined,
            dateTo ? lte(schema.leadActivities.createdAt, dateTo) : undefined,
            canViewAll
              ? undefined
              : eq(schema.leads.currentAssigneeUserId, currentUserId),
          ),
        )
        .orderBy(desc(schema.leadActivities.createdAt)),
    ]);

  const bookedLeadIds = new Set(
    bookings
      .map((booking) => booking.leadId)
      .filter((leadId): leadId is string => Boolean(leadId)),
  );

  const paymentCollected = bookings.reduce(
    (total, booking) => total + toNumber(booking.bookingFeePaidAmount),
    0,
  );

  const bookingFeeTotal = bookings.reduce(
    (total, booking) => total + toNumber(booking.bookingFeeAmount),
    0,
  );

  const conversionRate =
    leads.length > 0 ? Math.round((bookedLeadIds.size / leads.length) * 1000) / 10 : 0;

  return {
    leads: {
      total: leads.length,
      new: countByStatus(leads, ["NEW", "UNCONTACTED"]),
      active: countByStatus(leads, [
        "ASSIGNED",
        "CONTACTED",
        "QUALIFIED",
        "APPOINTMENT_SET",
        "NURTURING",
      ]),
      qualified: countByStatus(leads, ["QUALIFIED", "APPOINTMENT_SET", "CLOSED"]),
      lost: countByStatus(leads, ["LOST", "SPAM"]),
      conversionRate,
    },
    bookings: {
      total: bookings.length,
      active: countByStatus(bookings, [
        "DRAFT",
        "SUBMITTED",
        "UNDER_REVIEW",
        "PAYMENT_PENDING",
        "PAYMENT_VERIFIED",
        "DOCS_PENDING",
        "DOCS_VERIFIED",
      ]),
      approved: countByStatus(bookings, ["APPROVED"]),
      docsPending: countByStatus(bookings, ["DOCS_PENDING"]),
      paymentPending: countByStatus(bookings, ["PAYMENT_PENDING"]),
      paymentVerified: countByStatus(bookings, ["PAYMENT_VERIFIED"]),
      inactive: countByStatus(bookings, ["REJECTED", "EXPIRED", "CANCELLED"]),
      paymentCollected,
      bookingFeeTotal,
      currency: bookings[0]?.bookingFeeCurrency ?? "MYR",
      latest: bookings.slice(0, 8),
    },
    documents: {
      total: documentRequests.length,
      requested: countByRequestStatus(documentRequests, ["REQUESTED"]),
      submitted: countByRequestStatus(documentRequests, ["SUBMITTED"]),
      verified: countByRequestStatus(documentRequests, ["VERIFIED"]),
      rejected: countByRequestStatus(documentRequests, ["REJECTED"]),
      waived: countByRequestStatus(documentRequests, ["WAIVED"]),
      latest: documentRequests.slice(0, 8),
    },
    appointments: {
      total: appointmentActivities.length,
      completed: appointmentActivities.filter((activity) => activity.completedAt)
        .length,
      pending: appointmentActivities.filter((activity) => !activity.completedAt)
        .length,
      latest: appointmentActivities.slice(0, 8),
    },
  };
}

export type ReportOverview = Awaited<ReturnType<typeof getReportOverview>>;
