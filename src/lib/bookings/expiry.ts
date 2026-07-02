import "server-only";

import { and, asc, eq, isNull, lt, ne, or } from "drizzle-orm";

import { db, schema } from "@/db";
import {
  activeBookingWorkflowStatuses,
  expirableBookingWorkflowStatuses,
  loSignExpirableBookingWorkflowStatuses,
} from "@/lib/bookings/status";

type ExpireOverdueBookingsOptions = {
  now?: Date;
  limit?: number;
  dryRun?: boolean;
  actorUserId?: string | null;
  sourceEventType?: string;
};

type ExpiryType = "RESERVATION" | "LO_SIGN";

type ExpiredBookingResult = {
  bookingId: string;
  bookingCode: string;
  bookingUnitId: string;
  unitId: string;
  previousStatus: string;
  nextStatus: "EXPIRED";
  reservationExpiresAt: Date | null;
  loSignDueAt: Date | null;
  expiryType: ExpiryType;
  unitReleased: boolean;
  unitSetAvailable: boolean;
  dryRun: boolean;
};

function activeBookingStatusFilter() {
  return or(
    ...activeBookingWorkflowStatuses.map((status) =>
      eq(schema.bookings.status, status),
    ),
  );
}

function expirableBookingStatusFilter() {
  return or(
    ...expirableBookingWorkflowStatuses.map((status) =>
      eq(schema.bookings.status, status),
    ),
  );
}

function loSignExpirableBookingStatusFilter() {
  return or(
    ...loSignExpirableBookingWorkflowStatuses.map((status) =>
      eq(schema.bookings.status, status),
    ),
  );
}

function expiryCandidateFilter(now: Date) {
  return or(
    and(
      expirableBookingStatusFilter(),
      lt(schema.bookingUnits.reservationExpiresAt, now),
    ),
    and(
      loSignExpirableBookingStatusFilter(),
      lt(schema.bookingUnits.loSignDueAt, now),
    ),
  );
}

async function getAvailableUnitStatusId() {
  const rows = await db
    .select({
      id: schema.bookingStatuses.id,
    })
    .from(schema.bookingStatuses)
    .where(eq(schema.bookingStatuses.code, "AVAILABLE"))
    .limit(1);

  return rows[0]?.id ?? null;
}

function getExpiryType(row: {
  bookingStatus: string;
  loSignDueAt: Date | null;
}): ExpiryType {
  if (row.bookingStatus === "LO_OBTAINED" && row.loSignDueAt) {
    return "LO_SIGN";
  }

  return "RESERVATION";
}

function getExpiryReleaseReason({
  expiryType,
  reservationExpiresAt,
  loSignDueAt,
}: {
  expiryType: ExpiryType;
  reservationExpiresAt: Date | null;
  loSignDueAt: Date | null;
}) {
  if (expiryType === "LO_SIGN") {
    return loSignDueAt
      ? `LO signing period expired at ${loSignDueAt.toISOString()}.`
      : "LO signing period expired.";
  }

  return reservationExpiresAt
    ? `Booking reservation expired at ${reservationExpiresAt.toISOString()}.`
    : "Booking reservation expired.";
}

function getExpiryActivityBody(expiryType: ExpiryType) {
  if (expiryType === "LO_SIGN") {
    return "LO signing period expired and the reserved unit was released.";
  }

  return "Booking reservation expired and the reserved unit was released.";
}

function getExpiryReasonCode(expiryType: ExpiryType) {
  return expiryType === "LO_SIGN"
    ? "LO_SIGNING_PERIOD_EXPIRED"
    : "RESERVATION_EXPIRED";
}

export async function expireOverdueBookings({
  now = new Date(),
  limit = 100,
  dryRun = false,
  actorUserId = null,
  sourceEventType = "BOOKING_EXPIRY_AUTOMATION",
}: ExpireOverdueBookingsOptions = {}) {
  const availableStatusId = await getAvailableUnitStatusId();

  const candidates = await db
    .select({
      bookingUnitId: schema.bookingUnits.id,
      bookingId: schema.bookings.id,
      bookingCode: schema.bookings.bookingCode,
      bookingStatus: schema.bookings.status,
      leadId: schema.bookings.leadId,
      unitId: schema.bookingUnits.unitId,
      reservationExpiresAt: schema.bookingUnits.reservationExpiresAt,
      loSignDueAt: schema.bookingUnits.loSignDueAt,
    })
    .from(schema.bookingUnits)
    .innerJoin(schema.bookings, eq(schema.bookingUnits.bookingId, schema.bookings.id))
    .where(
      and(
        isNull(schema.bookingUnits.deletedAt),
        isNull(schema.bookingUnits.releasedAt),
        isNull(schema.bookings.deletedAt),
        expiryCandidateFilter(now),
      ),
    )
    .orderBy(asc(schema.bookingUnits.reservationExpiresAt))
    .limit(limit);

  const results = await Promise.all(
    candidates.map((candidate) =>
      db.transaction(async (tx): Promise<ExpiredBookingResult | null> => {
        const currentRows = await tx
          .select({
            bookingUnitId: schema.bookingUnits.id,
            bookingId: schema.bookings.id,
            bookingCode: schema.bookings.bookingCode,
            bookingStatus: schema.bookings.status,
            leadId: schema.bookings.leadId,
            unitId: schema.bookingUnits.unitId,
            reservationExpiresAt: schema.bookingUnits.reservationExpiresAt,
            loSignDueAt: schema.bookingUnits.loSignDueAt,
          })
          .from(schema.bookingUnits)
          .innerJoin(
            schema.bookings,
            eq(schema.bookingUnits.bookingId, schema.bookings.id),
          )
          .where(
            and(
              eq(schema.bookingUnits.id, candidate.bookingUnitId),
              isNull(schema.bookingUnits.deletedAt),
              isNull(schema.bookingUnits.releasedAt),
              isNull(schema.bookings.deletedAt),
              expiryCandidateFilter(now),
            ),
          )
          .limit(1);

        const current = currentRows[0];

        if (!current) {
          return null;
        }

        const expiryType = getExpiryType(current);
        const releaseReason = getExpiryReleaseReason({
          expiryType,
          reservationExpiresAt: current.reservationExpiresAt,
          loSignDueAt: current.loSignDueAt,
        });

        if (dryRun) {
          return {
            bookingId: current.bookingId,
            bookingCode: current.bookingCode,
            bookingUnitId: current.bookingUnitId,
            unitId: current.unitId,
            previousStatus: current.bookingStatus,
            nextStatus: "EXPIRED",
            reservationExpiresAt: current.reservationExpiresAt,
            loSignDueAt: current.loSignDueAt,
            expiryType,
            unitReleased: false,
            unitSetAvailable: false,
            dryRun: true,
          };
        }

        await tx
          .update(schema.bookings)
          .set({
            status: "EXPIRED",
            expiredAt: now,
            updatedAt: now,
          })
          .where(eq(schema.bookings.id, current.bookingId));

        await tx
          .update(schema.bookingUnits)
          .set({
            releasedAt: now,
            releaseReason,
            updatedAt: now,
          })
          .where(eq(schema.bookingUnits.id, current.bookingUnitId));

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
              eq(schema.bookingUnits.unitId, current.unitId),
              ne(schema.bookingUnits.bookingId, current.bookingId),
              isNull(schema.bookingUnits.deletedAt),
              isNull(schema.bookingUnits.releasedAt),
              isNull(schema.bookings.deletedAt),
              activeBookingStatusFilter(),
            ),
          )
          .limit(1);

        const shouldSetUnitAvailable =
          availableStatusId !== null && !otherActiveBookings[0];

        if (shouldSetUnitAvailable) {
          await tx
            .update(schema.units)
            .set({
              bookingStatusId: availableStatusId,
              updatedAt: now,
            })
            .where(eq(schema.units.id, current.unitId));
        }

        await tx.insert(schema.bookingStatusHistory).values({
          bookingId: current.bookingId,
          fromStatus: current.bookingStatus,
          toStatus: "EXPIRED",
          changedByUserId: actorUserId,
          changedAt: now,
          reasonCode: getExpiryReasonCode(expiryType),
          reasonNote: releaseReason,
          sourceEventType,
        });

        await tx.insert(schema.bookingActivities).values({
          bookingId: current.bookingId,
          actorUserId,
          activityType: "BOOKING_EXPIRED",
          title: "Booking expired automatically",
          body: getExpiryActivityBody(expiryType),
          visibilityScope: "INTERNAL",
          activityAt: now,
          metadata: {
            bookingUnitId: current.bookingUnitId,
            unitId: current.unitId,
            previousStatus: current.bookingStatus,
            nextStatus: "EXPIRED",
            reservationExpiresAt:
              current.reservationExpiresAt?.toISOString() ?? null,
            loSignDueAt: current.loSignDueAt?.toISOString() ?? null,
            expiryType,
            sourceEventType,
          },
        });

        if (current.leadId) {
          await tx.insert(schema.leadActivities).values({
            leadId: current.leadId,
            actorUserId,
            activityType: "BOOKING_EXPIRED",
            title: "Booking expired automatically",
            body:
              expiryType === "LO_SIGN"
                ? `Booking ${current.bookingCode} LO signing period expired.`
                : `Booking ${current.bookingCode} reservation expired.`,
            visibilityScope: "INTERNAL",
            metadata: {
              bookingId: current.bookingId,
              bookingCode: current.bookingCode,
              bookingUnitId: current.bookingUnitId,
              unitId: current.unitId,
              reservationExpiresAt:
                current.reservationExpiresAt?.toISOString() ?? null,
              loSignDueAt: current.loSignDueAt?.toISOString() ?? null,
              expiryType,
              sourceEventType,
            },
          });
        }

        return {
          bookingId: current.bookingId,
          bookingCode: current.bookingCode,
          bookingUnitId: current.bookingUnitId,
          unitId: current.unitId,
          previousStatus: current.bookingStatus,
          nextStatus: "EXPIRED",
          reservationExpiresAt: current.reservationExpiresAt,
          loSignDueAt: current.loSignDueAt,
          expiryType,
          unitReleased: true,
          unitSetAvailable: shouldSetUnitAvailable,
          dryRun: false,
        };
      }),
    ),
  );

  const expiredBookings = results.filter(
    (result): result is ExpiredBookingResult => result !== null,
  );

  return {
    checkedAt: now.toISOString(),
    dryRun,
    limit,
    scannedCount: candidates.length,
    expiredCount: expiredBookings.length,
    expiredBookings,
  };
}
