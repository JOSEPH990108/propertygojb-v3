import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";

import { db, schema } from "@/db";
import { requireRole } from "@/lib/auth/guards";

function normalizePhone(value: string | null | undefined) {
  return value?.replace(/\D/g, "").replace(/^0/, "60") ?? "";
}

/** Loads account identity and CRM history without exposing internal-only notes. */
export async function getCustomerAccountData(redirectTo = "/account") {
  const authContext = await requireRole(["CUSTOMER"], redirectTo);
  const sessionUser = authContext.user as { id?: string };

  if (!sessionUser.id) {
    throw new Error("Authenticated customer identity is missing.");
  }

  const user = await db.query.user.findFirst({
    where: (table, { eq }) => eq(table.id, sessionUser.id as string),
    columns: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      phoneNumber: true,
      phoneNumberVerified: true,
      nationality: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error("Customer account was not found.");
  }

  const normalizedPhone = normalizePhone(user.phoneNumber);
  const lead = await db.query.leads.findFirst({
    where: (table, { and, eq, isNull, or }) =>
      and(
        isNull(table.deletedAt),
        or(
          eq(table.customerUserId, user.id),
          ...(normalizedPhone
            ? [eq(table.primaryPhoneNormalized, normalizedPhone)]
            : []),
          eq(table.email, user.email),
        ),
      ),
    columns: {
      id: true,
      currentStatus: true,
      firstInquiryAt: true,
      lastActivityAt: true,
      currentAssigneeUserId: true,
    },
  });

  if (!lead) {
    return { user, lead: null, inquiries: [], bookings: [], viewings: [] };
  }

  const [inquiries, bookings, viewingRows] = await Promise.all([
    db
      .select({
        id: schema.inquiries.id,
        messageText: schema.inquiries.messageText,
        receivedAt: schema.inquiries.receivedAt,
        projectName: schema.projects.name,
        projectDisplayName: schema.projects.displayName,
        projectSlug: schema.projects.slug,
      })
      .from(schema.inquiries)
      .leftJoin(schema.projects, eq(schema.inquiries.projectId, schema.projects.id))
      .where(and(eq(schema.inquiries.leadId, lead.id), isNull(schema.inquiries.deletedAt)))
      .orderBy(desc(schema.inquiries.receivedAt)),
    db
      .select({
        id: schema.bookings.id,
        bookingCode: schema.bookings.bookingCode,
        status: schema.bookings.status,
        bookingFeeAmount: schema.bookings.bookingFeeAmount,
        bookingFeeCurrency: schema.bookings.bookingFeeCurrency,
        bookingFeePaidAmount: schema.bookings.bookingFeePaidAmount,
        submittedAt: schema.bookings.submittedAt,
        createdAt: schema.bookings.createdAt,
        projectName: schema.projects.name,
        projectDisplayName: schema.projects.displayName,
        projectSlug: schema.projects.slug,
        unitNo: schema.units.unitNo,
      })
      .from(schema.bookings)
      .leftJoin(schema.projects, eq(schema.bookings.projectId, schema.projects.id))
      .leftJoin(schema.bookingUnits, eq(schema.bookings.id, schema.bookingUnits.bookingId))
      .leftJoin(schema.units, eq(schema.bookingUnits.unitId, schema.units.id))
      .where(and(eq(schema.bookings.leadId, lead.id), isNull(schema.bookings.deletedAt)))
      .orderBy(desc(schema.bookings.createdAt)),
    db
      .select({
        id: schema.leadActivities.id,
        dueAt: schema.leadActivities.dueAt,
        completedAt: schema.leadActivities.completedAt,
        createdAt: schema.leadActivities.createdAt,
        metadata: schema.leadActivities.metadata,
      })
      .from(schema.leadActivities)
      .where(
        and(
          eq(schema.leadActivities.leadId, lead.id),
          eq(schema.leadActivities.activityType, "VIEWING_APPOINTMENT"),
          isNull(schema.leadActivities.deletedAt),
        ),
      )
      .orderBy(desc(schema.leadActivities.createdAt)),
  ]);

  const viewings = viewingRows.map((viewing) => {
    const metadata =
      viewing.metadata &&
      typeof viewing.metadata === "object" &&
      !Array.isArray(viewing.metadata)
        ? (viewing.metadata as {
            appointmentStatus?: string;
            projectName?: string;
            projectId?: string;
            locationText?: string | null;
            durationMinutes?: number;
            timeZone?: string;
          })
        : {};

    return {
      id: viewing.id,
      preferredAt: viewing.dueAt,
      completedAt: viewing.completedAt,
      createdAt: viewing.createdAt,
      status: metadata.appointmentStatus ?? "SCHEDULED",
      projectName: metadata.projectName ?? "Project viewing",
      projectId: metadata.projectId ?? null,
      locationText: metadata.locationText ?? null,
      durationMinutes: metadata.durationMinutes ?? 60,
      timeZone: metadata.timeZone ?? "Asia/Kuala_Lumpur",
    };
  });

  return { user, lead, inquiries, bookings, viewings };
}
