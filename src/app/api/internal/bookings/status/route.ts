import { and, eq, isNull } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";

const bookingStatusOptions = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "DOCS_PENDING",
  "DOCS_VERIFIED",
  "PAYMENT_PENDING",
  "PAYMENT_VERIFIED",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
] as const;

const updateBookingStatusSchema = z.object({
  bookingId: z.string().min(1, "Booking is required."),
  nextStatus: z.enum(bookingStatusOptions),
  reasonNote: z.string().trim().max(2000).optional().default(""),
});

type BookingStatus = (typeof bookingStatusOptions)[number];

const terminalStatuses: BookingStatus[] = ["APPROVED", "REJECTED", "EXPIRED", "CANCELLED"];

function isReasonRequired(status: BookingStatus) {
  return status === "REJECTED" || status === "CANCELLED";
}

function getStatusActivity(status: BookingStatus) {
  switch (status) {
    case "SUBMITTED":
      return {
        activityType: "BOOKING_SUBMITTED",
        title: "Booking submitted",
        body: "Booking was submitted for internal review.",
      };
    case "UNDER_REVIEW":
      return {
        activityType: "BOOKING_UNDER_REVIEW",
        title: "Booking under review",
        body: "Booking was marked as under review.",
      };
    case "DOCS_PENDING":
      return {
        activityType: "BOOKING_DOCS_PENDING",
        title: "Documents pending",
        body: "Booking is waiting for required documents.",
      };
    case "DOCS_VERIFIED":
      return {
        activityType: "BOOKING_DOCS_VERIFIED",
        title: "Documents verified",
        body: "Booking documents were marked as verified.",
      };
    case "PAYMENT_PENDING":
      return {
        activityType: "BOOKING_PAYMENT_PENDING",
        title: "Payment pending",
        body: "Booking is waiting for payment confirmation.",
      };
    case "PAYMENT_VERIFIED":
      return {
        activityType: "BOOKING_PAYMENT_VERIFIED",
        title: "Payment verified",
        body: "Booking payment was marked as verified.",
      };
    case "APPROVED":
      return {
        activityType: "BOOKING_APPROVED",
        title: "Booking approved",
        body: "Booking was approved.",
      };
    case "REJECTED":
      return {
        activityType: "BOOKING_REJECTED",
        title: "Booking rejected",
        body: "Booking was rejected.",
      };
    case "EXPIRED":
      return {
        activityType: "BOOKING_EXPIRED",
        title: "Booking expired",
        body: "Booking was marked as expired.",
      };
    case "CANCELLED":
      return {
        activityType: "BOOKING_CANCELLED",
        title: "Booking cancelled",
        body: "Booking was cancelled.",
      };
    case "DRAFT":
    default:
      return {
        activityType: "BOOKING_STATUS_UPDATED",
        title: "Booking status updated",
        body: "Booking status was updated.",
      };
  }
}

async function findBookingStatusId(code: string) {
  const rows = await db
    .select({
      id: schema.bookingStatuses.id,
    })
    .from(schema.bookingStatuses)
    .where(eq(schema.bookingStatuses.code, code))
    .limit(1);

  return rows[0]?.id ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireRole(
      ["ADMIN", "SUPER_ADMIN"],
      "/admin/bookings",
    );

    const currentUser = authContext.user as { id?: unknown };
    const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";

    if (!currentUserId) {
      return errorJson("Current user not found.", 401);
    }

    const body = await request.json();
    const validated = updateBookingStatusSchema.parse(body);

    if (isReasonRequired(validated.nextStatus) && !validated.reasonNote) {
      return errorJson("Reason is required for rejected or cancelled booking.", 400);
    }

    const booking = await db.query.bookings.findFirst({
      where: (table, { and, eq, isNull }) =>
        and(eq(table.id, validated.bookingId), isNull(table.deletedAt)),
      columns: {
        id: true,
        bookingCode: true,
        status: true,
        leadId: true,
      },
    });

    if (!booking) {
      return errorJson("Booking not found.", 404);
    }

    if (booking.status === validated.nextStatus) {
      return errorJson("Booking already has this status.", 400);
    }

    if (
      terminalStatuses.includes(booking.status as BookingStatus) &&
      booking.status !== "APPROVED"
    ) {
      return errorJson("Terminal booking status cannot be changed.", 400);
    }

    const now = new Date();
    const activity = getStatusActivity(validated.nextStatus);

    await db.transaction(async (tx) => {
      await tx
        .update(schema.bookings)
        .set({
          status: validated.nextStatus,
          submittedAt: validated.nextStatus === "SUBMITTED" ? now : undefined,
          approvedAt: validated.nextStatus === "APPROVED" ? now : undefined,
          rejectedAt: validated.nextStatus === "REJECTED" ? now : undefined,
          rejectionReason:
            validated.nextStatus === "REJECTED" ? validated.reasonNote : undefined,
          cancelledAt: validated.nextStatus === "CANCELLED" ? now : undefined,
          cancellationReason:
            validated.nextStatus === "CANCELLED" ? validated.reasonNote : undefined,
          updatedAt: now,
        })
        .where(eq(schema.bookings.id, booking.id));

      await tx.insert(schema.bookingStatusHistory).values({
        bookingId: booking.id,
        fromStatus: booking.status,
        toStatus: validated.nextStatus,
        changedByUserId: currentUserId,
        changedAt: now,
        reasonCode: `STATUS_${validated.nextStatus}`,
        reasonNote: validated.reasonNote || null,
        sourceEventType: "ADMIN_BOOKING_STATUS",
      });

      await tx.insert(schema.bookingActivities).values({
        bookingId: booking.id,
        actorUserId: currentUserId,
        activityType: activity.activityType,
        title: activity.title,
        body: validated.reasonNote
          ? `${activity.body} Reason: ${validated.reasonNote}`
          : activity.body,
        visibilityScope: "INTERNAL",
        activityAt: now,
        metadata: {
          fromStatus: booking.status,
          toStatus: validated.nextStatus,
          reasonNote: validated.reasonNote || null,
        },
      });

      if (booking.leadId) {
        await tx.insert(schema.leadActivities).values({
          leadId: booking.leadId,
          actorUserId: currentUserId,
          activityType: activity.activityType,
          title: activity.title,
          body: `Booking ${booking.bookingCode}: ${activity.body}`,
          visibilityScope: "INTERNAL",
          metadata: {
            bookingId: booking.id,
            bookingCode: booking.bookingCode,
            fromStatus: booking.status,
            toStatus: validated.nextStatus,
          },
        });
      }

      if (validated.nextStatus === "APPROVED") {
        const bookedStatusId =
          (await findBookingStatusId("BOOKED")) ??
          (await findBookingStatusId("RESERVED"));

        if (bookedStatusId) {
          const bookingUnits = await tx
            .select({
              unitId: schema.bookingUnits.unitId,
            })
            .from(schema.bookingUnits)
            .where(
              and(
                eq(schema.bookingUnits.bookingId, booking.id),
                isNull(schema.bookingUnits.deletedAt),
              ),
            );

          await Promise.all(
            bookingUnits.map((bookingUnit) =>
              tx
                .update(schema.units)
                .set({
                  bookingStatusId: bookedStatusId,
                })
                .where(eq(schema.units.id, bookingUnit.unitId)),
            ),
          );
        }
      }

      if (
        validated.nextStatus === "REJECTED" ||
        validated.nextStatus === "CANCELLED" ||
        validated.nextStatus === "EXPIRED"
      ) {
        await tx
          .update(schema.bookingUnits)
          .set({
            releasedAt: now,
            releaseReason: validated.reasonNote || `Booking ${validated.nextStatus}`,
            updatedAt: now,
          })
          .where(eq(schema.bookingUnits.bookingId, booking.id));

        const availableStatusId = await findBookingStatusId("AVAILABLE");

        if (availableStatusId) {
          const bookingUnits = await tx
            .select({
              unitId: schema.bookingUnits.unitId,
            })
            .from(schema.bookingUnits)
            .where(eq(schema.bookingUnits.bookingId, booking.id));

          await Promise.all(
            bookingUnits.map((bookingUnit) =>
              tx
                .update(schema.units)
                .set({
                  bookingStatusId: availableStatusId,
                })
                .where(eq(schema.units.id, bookingUnit.unitId)),
            ),
          );
        }
      }
    });

    return okJson({
      message: "Booking status updated successfully.",
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      status: validated.nextStatus,
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
