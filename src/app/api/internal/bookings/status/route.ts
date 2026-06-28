import { and, eq, isNull, or } from "drizzle-orm";
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

function toAmount(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);

  if (Number.isNaN(amount)) {
    return 0;
  }

  return amount;
}

async function validateBookingApprovalReadiness(booking: {
  id: string;
  bookingCode: string;
  bookingFeeAmount: string | number | null;
  bookingFeePaidAmount: string | number | null;
}) {
  const bookingFeeAmount = toAmount(booking.bookingFeeAmount);
  const bookingFeePaidAmount = toAmount(booking.bookingFeePaidAmount);

  if (bookingFeeAmount > 0 && bookingFeePaidAmount < bookingFeeAmount) {
    return {
      ok: false,
      message: `Booking ${booking.bookingCode} cannot be approved yet. Booking fee is not fully paid.`,
    };
  }

  const unresolvedDocumentRequests = await db
    .select({
      id: schema.documentRequests.id,
      requestStatus: schema.documentRequests.requestStatus,
      documentTypeName: schema.documentTypes.name,
      documentTypeCode: schema.documentTypes.code,
    })
    .from(schema.documentRequests)
    .innerJoin(
      schema.documentTypes,
      eq(schema.documentRequests.documentTypeId, schema.documentTypes.id),
    )
    .where(
      and(
        eq(schema.documentRequests.bookingId, booking.id),
        isNull(schema.documentRequests.deletedAt),
        or(
          eq(schema.documentRequests.requestStatus, "REQUESTED"),
          eq(schema.documentRequests.requestStatus, "SUBMITTED"),
          eq(schema.documentRequests.requestStatus, "REJECTED"),
        ),
      ),
    )
    .limit(5);

  if (unresolvedDocumentRequests.length > 0) {
    const documentNames = unresolvedDocumentRequests
      .map((request) => request.documentTypeName ?? request.documentTypeCode)
      .filter(Boolean)
      .join(", ");

    return {
      ok: false,
      message: documentNames
        ? `Booking ${booking.bookingCode} cannot be approved yet. Pending documents: ${documentNames}.`
        : `Booking ${booking.bookingCode} cannot be approved yet. Some documents are still pending.`,
    };
  }

  return {
    ok: true,
    message: null,
  };
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
        bookingFeeAmount: true,
        bookingFeePaidAmount: true,
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

    if (validated.nextStatus === "APPROVED") {
      const readiness = await validateBookingApprovalReadiness(booking);

      if (!readiness.ok) {
        return errorJson(readiness.message ?? "Booking is not ready for approval.", 400);
      }
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
        const soldStatusId =
          (await findBookingStatusId("APPROVED")) ??
          (await findBookingStatusId("SOLD")) ??
          (await findBookingStatusId("RESERVED"));

        if (soldStatusId) {
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
                  bookingStatusId: soldStatusId,
                  updatedAt: now,
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

        await tx
          .update(schema.bookingUnits)
          .set({
            releasedAt: now,
            releaseReason: validated.reasonNote || `Booking ${validated.nextStatus}`,
            updatedAt: now,
          })
          .where(
            and(
              eq(schema.bookingUnits.bookingId, booking.id),
              isNull(schema.bookingUnits.deletedAt),
              isNull(schema.bookingUnits.releasedAt),
            ),
          );

        const availableStatusId = await findBookingStatusId("AVAILABLE");

        if (availableStatusId) {
          for (const bookingUnit of bookingUnits) {
            const otherActiveBookings = await tx
              .select({
                bookingId: schema.bookingUnits.bookingId,
              })
              .from(schema.bookingUnits)
              .innerJoin(
                schema.bookings,
                eq(schema.bookingUnits.bookingId, schema.bookings.id),
              )
              .where(
                and(
                  eq(schema.bookingUnits.unitId, bookingUnit.unitId),
                  isNull(schema.bookingUnits.deletedAt),
                  isNull(schema.bookingUnits.releasedAt),
                  isNull(schema.bookings.deletedAt),
                  or(
                    eq(schema.bookings.status, "DRAFT"),
                    eq(schema.bookings.status, "SUBMITTED"),
                    eq(schema.bookings.status, "UNDER_REVIEW"),
                    eq(schema.bookings.status, "DOCS_PENDING"),
                    eq(schema.bookings.status, "DOCS_VERIFIED"),
                    eq(schema.bookings.status, "PAYMENT_PENDING"),
                    eq(schema.bookings.status, "PAYMENT_VERIFIED"),
                    eq(schema.bookings.status, "APPROVED"),
                  ),
                ),
              )
              .limit(1);

            if (!otherActiveBookings[0]) {
              await tx
                .update(schema.units)
                .set({
                  bookingStatusId: availableStatusId,
                  updatedAt: now,
                })
                .where(eq(schema.units.id, bookingUnit.unitId));
            }
          }
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
