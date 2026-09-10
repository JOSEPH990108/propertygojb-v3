import { and, eq, isNull } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";

const updateUnitStatusSchema = z.object({
  unitId: z.string().min(1, "Unit is required."),
  bookingStatusId: z.string().min(1, "Booking status is required."),
  note: z.string().trim().max(1000).optional().default(""),
});

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireRole(
      ["ADMIN", "SUPER_ADMIN"],
      "/admin/properties",
    );

    const currentUser = authContext.user as { id?: unknown };
    const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";

    if (!currentUserId) {
      return errorJson("Current user not found.", 401);
    }

    const body = await request.json();
    const validated = updateUnitStatusSchema.parse(body);

    const unitRows = await db
      .select({
        unitId: schema.units.id,
        unitNo: schema.units.unitNo,
        bookingStatusId: schema.units.bookingStatusId,
        currentStatusCode: schema.bookingStatuses.code,
        currentStatusName: schema.bookingStatuses.name,
        projectName: schema.projects.name,
        projectDisplayName: schema.projects.displayName,
      })
      .from(schema.units)
      .innerJoin(schema.projects, eq(schema.units.projectId, schema.projects.id))
      .innerJoin(
        schema.bookingStatuses,
        eq(schema.units.bookingStatusId, schema.bookingStatuses.id),
      )
      .where(
        and(
          eq(schema.units.id, validated.unitId),
          isNull(schema.units.deletedAt),
          isNull(schema.projects.deletedAt),
        ),
      )
      .limit(1);

    const unit = unitRows[0];

    if (!unit) {
      return errorJson("Unit not found.", 404);
    }

    const nextStatus = await db.query.bookingStatuses.findFirst({
      where: (table, { eq }) => eq(table.id, validated.bookingStatusId),
      columns: {
        id: true,
        code: true,
        name: true,
      },
    });

    if (!nextStatus) {
      return errorJson("Booking status not found.", 404);
    }

    if (unit.bookingStatusId === nextStatus.id) {
      return okJson({
        message: "Unit status is already up to date.",
        unitId: unit.unitId,
        statusCode: nextStatus.code,
        statusName: nextStatus.name,
      });
    }

    const now = new Date();

    await db
      .update(schema.units)
      .set({
        bookingStatusId: nextStatus.id,
        updatedAt: now,
      })
      .where(eq(schema.units.id, unit.unitId));

    return okJson({
      message: `Unit ${unit.unitNo} status updated to ${nextStatus.name}.`,
      unitId: unit.unitId,
      unitNo: unit.unitNo,
      fromStatus: unit.currentStatusName,
      toStatus: nextStatus.name,
      statusCode: nextStatus.code,
      statusName: nextStatus.name,
      note: validated.note || null,
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
