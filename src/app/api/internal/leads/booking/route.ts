import { randomInt } from "crypto";

import { and, eq, isNull, or } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";

const createLeadBookingSchema = z.object({
  leadId: z.string().min(1, "Lead is required."),
  projectId: z.string().min(1, "Project is required."),
  unitId: z.string().min(1, "Unit is required."),
  bookingFeeAmount: z.coerce.number().min(0).optional().default(0),
  note: z.string().trim().max(2000).optional().default(""),
});

function createBookingCode() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const randomSuffix = String(randomInt(1000, 9999));

  return `BKG-${year}${month}${day}-${randomSuffix}`;
}

async function createUniqueBookingCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const bookingCode = createBookingCode();

    const existing = await db.query.bookings.findFirst({
      where: (table, { eq }) => eq(table.bookingCode, bookingCode),
      columns: {
        id: true,
      },
    });

    if (!existing) {
      return bookingCode;
    }
  }

  throw new Error("Unable to generate booking code. Please try again.");
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireRole(
      ["ADMIN", "SUPER_ADMIN", "AGENT"],
      "/admin/leads",
    );

    const currentUser = authContext.user as { id?: unknown };
    const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";

    if (!currentUserId) {
      return errorJson("Current user not found.", 401);
    }

    const body = await request.json();
    const validated = createLeadBookingSchema.parse(body);

    const lead = await db.query.leads.findFirst({
      where: (table, { eq }) => eq(table.id, validated.leadId),
      columns: {
        id: true,
        fullName: true,
        primaryPhoneE164: true,
        email: true,
        currentStatus: true,
        currentAssigneeUserId: true,
        deletedAt: true,
      },
    });

    if (!lead || lead.deletedAt) {
      return errorJson("Lead not found.", 404);
    }

    const isAgent = authContext.roleCode === "AGENT";

    if (isAgent && lead.currentAssigneeUserId !== currentUserId) {
      return errorJson("Only the assigned agent can create booking.", 403);
    }

    const unitRows = await db
      .select({
        id: schema.units.id,
        projectId: schema.units.projectId,
        unitNo: schema.units.unitNo,
        basePrice: schema.units.basePrice,
        finalPrice: schema.units.finalPrice,
        bookingStatusCode: schema.bookingStatuses.code,
      })
      .from(schema.units)
      .leftJoin(
        schema.bookingStatuses,
        eq(schema.units.bookingStatusId, schema.bookingStatuses.id),
      )
      .where(
        and(
          eq(schema.units.id, validated.unitId),
          eq(schema.units.projectId, validated.projectId),
          isNull(schema.units.deletedAt),
        ),
      )
      .limit(1);

    const unit = unitRows[0];

    if (!unit) {
      return errorJson("Selected unit not found.", 404);
    }

    if (unit.bookingStatusCode && unit.bookingStatusCode !== "AVAILABLE") {
      return errorJson("Selected unit is not available.", 400);
    }

    const project = await db.query.projects.findFirst({
      where: (table, { eq }) => eq(table.id, validated.projectId),
      columns: {
        id: true,
        name: true,
        displayName: true,
      },
    });

    if (!project) {
      return errorJson("Project not found.", 404);
    }

    const now = new Date();
    const bookingFeeAmount = validated.bookingFeeAmount.toFixed(2);
    const reservedPrice = unit.finalPrice ?? unit.basePrice;

    const result = await db.transaction(async (tx) => {
      const existingLeadBookings = await tx
        .select({
          id: schema.bookings.id,
          bookingCode: schema.bookings.bookingCode,
        })
        .from(schema.bookings)
        .where(and(eq(schema.bookings.leadId, lead.id), isNull(schema.bookings.deletedAt)))
        .limit(1);

      const existingLeadBooking = existingLeadBookings[0];

      if (existingLeadBooking) {
        return {
          alreadyExists: true,
          bookingId: existingLeadBooking.id,
          bookingCode: existingLeadBooking.bookingCode,
        };
      }

      const existingUnitBookings = await tx
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
            eq(schema.bookingUnits.unitId, unit.id),
            isNull(schema.bookingUnits.deletedAt),
            isNull(schema.bookings.deletedAt),
          ),
        )
        .limit(1);

      if (existingUnitBookings[0]) {
        throw new Error("Selected unit already has an active booking.");
      }

      const bookingCode = await createUniqueBookingCode();

      const insertedBookings = await tx
        .insert(schema.bookings)
        .values({
          leadId: lead.id,
          projectId: project.id,
          bookingCode,
          status: "DRAFT",
          bookingChannel: "LEAD_DETAIL",
          submittedByUserId: currentUserId,
          assignedAgentUserId: lead.currentAssigneeUserId ?? currentUserId,
          bookingFeeAmount,
          bookingFeePaidAmount: "0.00",
          metadata: {
            source: "LEAD_DETAIL",
            projectName: project.displayName ?? project.name,
            unitNo: unit.unitNo,
            note: validated.note || null,
            createdByRole: authContext.roleCode,
          },
        })
        .returning({
          id: schema.bookings.id,
          bookingCode: schema.bookings.bookingCode,
        });

      const booking = insertedBookings[0];

      if (!booking) {
        throw new Error("Failed to create booking.");
      }

      await tx.insert(schema.bookingUnits).values({
        bookingId: booking.id,
        projectId: project.id,
        unitId: unit.id,
        reservedPrice,
        bookingFeeAllocatedAmount: bookingFeeAmount,
        reservationStartedAt: now,
      });

      await tx.insert(schema.bookingParticipants).values({
        bookingId: booking.id,
        role: "BUYER",
        fullName: lead.fullName ?? "Customer",
        phoneE164: lead.primaryPhoneE164,
        email: lead.email,
        isPrimaryContact: true,
        isSignatory: true,
        participantOrder: 1,
      });

      await tx.insert(schema.bookingStatusHistory).values({
        bookingId: booking.id,
        fromStatus: null,
        toStatus: "DRAFT",
        changedByUserId: currentUserId,
        changedAt: now,
        reasonCode: "CREATED_FROM_LEAD",
        reasonNote: validated.note || null,
        sourceEventType: "LEAD_BOOKING",
      });

      await tx.insert(schema.bookingActivities).values({
        bookingId: booking.id,
        actorUserId: currentUserId,
        activityType: "BOOKING_CREATED",
        title: "Booking created from lead",
        body: validated.note
          ? `Booking ${booking.bookingCode} was created from lead. Note: ${validated.note}`
          : `Booking ${booking.bookingCode} was created from lead ${lead.fullName ?? "Customer"}.`,
        visibilityScope: "INTERNAL",
        activityAt: now,
        metadata: {
          leadId: lead.id,
          projectId: project.id,
          unitId: unit.id,
          unitNo: unit.unitNo,
        },
      });

      await tx.insert(schema.leadActivities).values({
        leadId: lead.id,
        actorUserId: currentUserId,
        activityType: "BOOKING_CREATED",
        title: "Booking created",
        body: `Booking ${booking.bookingCode} created for unit ${unit.unitNo}.`,
        visibilityScope: "INTERNAL",
        metadata: {
          bookingId: booking.id,
          bookingCode: booking.bookingCode,
          projectId: project.id,
          unitId: unit.id,
          unitNo: unit.unitNo,
          note: validated.note || null,
        },
      });

      await tx
        .update(schema.leads)
        .set({
          currentStatus: "QUALIFIED",
          lastActivityAt: now,
          updatedAt: now,
        })
        .where(eq(schema.leads.id, lead.id));

      if (lead.currentStatus !== "QUALIFIED") {
        await tx.insert(schema.leadStatusHistory).values({
          leadId: lead.id,
          fromStatus: lead.currentStatus,
          toStatus: "QUALIFIED",
          changedByUserId: currentUserId,
          changedAt: now,
          reasonCode: "BOOKING_CREATED",
          sourceEventType: "LEAD_BOOKING",
        });
      }

      const reservedStatuses = await tx
        .select({
          id: schema.bookingStatuses.id,
        })
        .from(schema.bookingStatuses)
        .where(
          or(
            eq(schema.bookingStatuses.code, "RESERVED"),
            eq(schema.bookingStatuses.code, "BOOKED"),
          ),
        )
        .limit(1);

      const reservedStatus = reservedStatuses[0];

      if (reservedStatus) {
        await tx
          .update(schema.units)
          .set({
            bookingStatusId: reservedStatus.id,
          })
          .where(eq(schema.units.id, unit.id));
      }

      return {
        alreadyExists: false,
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
      };
    });

    return okJson({
      message: result.alreadyExists
        ? "Booking already exists for this lead."
        : "Booking created successfully.",
      bookingId: result.bookingId,
      bookingCode: result.bookingCode,
      alreadyExists: result.alreadyExists,
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
