import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";

const createBookingNoteSchema = z.object({
  bookingId: z.string().min(1, "Booking is required."),
  note: z.string().trim().min(1, "Note is required.").max(3000),
});

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireRole(
      ["ADMIN", "SUPER_ADMIN", "AGENT"],
      "/admin/bookings",
    );

    const currentUser = authContext.user as { id?: unknown };
    const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";

    if (!currentUserId) {
      return errorJson("Current user not found.", 401);
    }

    const body = await request.json();
    const validated = createBookingNoteSchema.parse(body);

    const booking = await db.query.bookings.findFirst({
      where: (table, { and, eq, isNull }) =>
        and(eq(table.id, validated.bookingId), isNull(table.deletedAt)),
      columns: {
        id: true,
        bookingCode: true,
        leadId: true,
        assignedAgentUserId: true,
      },
    });

    if (!booking) {
      return errorJson("Booking not found.", 404);
    }

    const canManageAll =
      authContext.roleCode === "ADMIN" || authContext.roleCode === "SUPER_ADMIN";

    if (!canManageAll && booking.assignedAgentUserId !== currentUserId) {
      return errorJson("You can only add notes for assigned bookings.", 403);
    }

    const now = new Date();

    await db.transaction(async (tx) => {
      await tx.insert(schema.bookingActivities).values({
        bookingId: booking.id,
        actorUserId: currentUserId,
        activityType: "BOOKING_NOTE",
        title: "Booking note added",
        body: validated.note,
        visibilityScope: "INTERNAL",
        activityAt: now,
        metadata: {
          source: "BOOKING_DETAIL",
          bookingCode: booking.bookingCode,
        },
      });

      if (booking.leadId) {
        await tx.insert(schema.leadActivities).values({
          leadId: booking.leadId,
          actorUserId: currentUserId,
          activityType: "BOOKING_NOTE",
          title: "Booking note added",
          body: `Booking ${booking.bookingCode}: ${validated.note}`,
          visibilityScope: "INTERNAL",
          metadata: {
            source: "BOOKING_DETAIL",
            bookingId: booking.id,
            bookingCode: booking.bookingCode,
          },
        });
      }
    });

    return okJson({
      message: "Booking note added successfully.",
      bookingId: booking.id,
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
