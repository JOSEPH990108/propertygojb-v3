import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";

const createBookingPaymentSchema = z.object({
  bookingId: z.string().min(1, "Booking is required."),
  amount: z.coerce.number().positive("Payment amount must be more than 0."),
  paymentMethod: z.string().trim().min(1, "Payment method is required.").max(30),
  referenceNo: z.string().trim().max(120).optional().default(""),
  receivedAt: z.string().trim().optional().default(""),
  note: z.string().trim().max(2000).optional().default(""),
  markVerified: z.boolean().optional().default(true),
});

function toMoney(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);

  if (Number.isNaN(amount)) {
    return 0;
  }

  return amount;
}

function parseReceivedAt(value: string) {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
}

const bookingStatusOptions = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "PAYMENT_PENDING",
  "PAYMENT_VERIFIED",
  "DOCS_PENDING",
  "DOCS_VERIFIED",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
] as const;

type BookingStatus = (typeof bookingStatusOptions)[number];

function isBookingStatus(value: string): value is BookingStatus {
  return bookingStatusOptions.includes(value as BookingStatus);
}

function normalizeBookingStatus(value: string): BookingStatus {
  return isBookingStatus(value) ? value : "DRAFT";
}

function getNextBookingStatus({
  currentStatus,
  markVerified,
}: {
  currentStatus: string;
  markVerified: boolean;
}): BookingStatus {
  const normalizedCurrentStatus = normalizeBookingStatus(currentStatus);

  if (
    ["APPROVED", "REJECTED", "EXPIRED", "CANCELLED"].includes(
      normalizedCurrentStatus,
    )
  ) {
    return normalizedCurrentStatus;
  }

  if (markVerified) {
    return "PAYMENT_VERIFIED";
  }

  if (
    normalizedCurrentStatus === "DRAFT" ||
    normalizedCurrentStatus === "SUBMITTED"
  ) {
    return "PAYMENT_PENDING";
  }

  return normalizedCurrentStatus;
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
    const validated = createBookingPaymentSchema.parse(body);

    const booking = await db.query.bookings.findFirst({
      where: (table, { and, eq, isNull }) =>
        and(eq(table.id, validated.bookingId), isNull(table.deletedAt)),
      columns: {
        id: true,
        bookingCode: true,
        status: true,
        leadId: true,
        bookingFeeAmount: true,
        bookingFeeCurrency: true,
        bookingFeePaidAmount: true,
      },
    });

    if (!booking) {
      return errorJson("Booking not found.", 404);
    }

    if (["REJECTED", "EXPIRED", "CANCELLED"].includes(booking.status)) {
      return errorJson("Payment cannot be added to inactive booking.", 400);
    }

    const now = new Date();
    const receivedAt = parseReceivedAt(validated.receivedAt);
    const paymentStatus = validated.markVerified ? "VERIFIED" : "RECEIVED";
    const nextPaidAmount =
      toMoney(booking.bookingFeePaidAmount) + validated.amount;
    const nextStatus = getNextBookingStatus({
      currentStatus: booking.status,
      markVerified: validated.markVerified,
    });

    await db.transaction(async (tx) => {
      await tx.insert(schema.bookingPayments).values({
        bookingId: booking.id,
        paymentType: "BOOKING_FEE",
        amount: validated.amount.toFixed(2),
        currency: booking.bookingFeeCurrency,
        paymentMethod: validated.paymentMethod,
        paymentStatus,
        receivedAt,
        verifiedAt: validated.markVerified ? now : null,
        verifiedByUserId: validated.markVerified ? currentUserId : null,
        referenceNo: validated.referenceNo || null,
        reasonNote: validated.note || null,
        metadata: {
          source: "ADMIN_BOOKING_DETAIL",
          markVerified: validated.markVerified,
        },
      });

      await tx
        .update(schema.bookings)
        .set({
          bookingFeePaidAmount: nextPaidAmount.toFixed(2),
          status: nextStatus,
          updatedAt: now,
        })
        .where(eq(schema.bookings.id, booking.id));

      await tx.insert(schema.bookingActivities).values({
        bookingId: booking.id,
        actorUserId: currentUserId,
        activityType: validated.markVerified
          ? "BOOKING_PAYMENT_VERIFIED"
          : "BOOKING_PAYMENT_RECEIVED",
        title: validated.markVerified
          ? "Booking payment verified"
          : "Booking payment received",
        body: validated.referenceNo
          ? `Payment reference ${validated.referenceNo} recorded.`
          : "Booking fee payment recorded.",
        visibilityScope: "INTERNAL",
        activityAt: now,
        metadata: {
          amount: validated.amount.toFixed(2),
          currency: booking.bookingFeeCurrency,
          paymentMethod: validated.paymentMethod,
          referenceNo: validated.referenceNo || null,
          note: validated.note || null,
        },
      });

      if (booking.status !== nextStatus) {
        await tx.insert(schema.bookingStatusHistory).values({
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: nextStatus,
          changedByUserId: currentUserId,
          changedAt: now,
          reasonCode: validated.markVerified
            ? "PAYMENT_VERIFIED"
            : "PAYMENT_RECEIVED",
          reasonNote: validated.note || null,
          sourceEventType: "BOOKING_PAYMENT",
        });
      }

      if (booking.leadId) {
        await tx.insert(schema.leadActivities).values({
          leadId: booking.leadId,
          actorUserId: currentUserId,
          activityType: validated.markVerified
            ? "BOOKING_PAYMENT_VERIFIED"
            : "BOOKING_PAYMENT_RECEIVED",
          title: validated.markVerified
            ? "Booking payment verified"
            : "Booking payment received",
          body: `Booking ${booking.bookingCode} payment recorded.`,
          visibilityScope: "INTERNAL",
          metadata: {
            bookingId: booking.id,
            bookingCode: booking.bookingCode,
            amount: validated.amount.toFixed(2),
            currency: booking.bookingFeeCurrency,
            referenceNo: validated.referenceNo || null,
          },
        });
      }
    });

    return okJson({
      message: validated.markVerified
        ? "Payment recorded and verified successfully."
        : "Payment recorded successfully.",
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      status: nextStatus,
      bookingFeePaidAmount: nextPaidAmount.toFixed(2),
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
