import { and, eq, isNull } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";

const appointmentActionSchema = z.object({
  activityId: z.string().min(1, "Appointment is required."),
  action: z.enum(["COMPLETE", "CANCEL", "REOPEN"]),
});

function getMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function getActionConfig(action: "COMPLETE" | "CANCEL" | "REOPEN") {
  switch (action) {
    case "COMPLETE":
      return {
        status: "COMPLETED",
        title: "Viewing appointment completed",
        body: "Viewing appointment was marked as completed.",
      };
    case "CANCEL":
      return {
        status: "CANCELLED",
        title: "Viewing appointment cancelled",
        body: "Viewing appointment was cancelled.",
      };
    case "REOPEN":
      return {
        status: "SCHEDULED",
        title: "Viewing appointment reopened",
        body: "Viewing appointment was reopened as scheduled.",
      };
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireRole(
      ["ADMIN", "SUPER_ADMIN", "AGENT"],
      "/admin/appointments",
    );

    const currentUser = authContext.user as { id?: unknown };
    const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";

    if (!currentUserId) {
      return errorJson("Current user not found.", 401);
    }

    const body = await request.json();
    const validated = appointmentActionSchema.parse(body);

    const rows = await db
      .select({
        activityId: schema.leadActivities.id,
        leadId: schema.leadActivities.leadId,
        metadata: schema.leadActivities.metadata,
        leadAssigneeUserId: schema.leads.currentAssigneeUserId,
      })
      .from(schema.leadActivities)
      .innerJoin(schema.leads, eq(schema.leadActivities.leadId, schema.leads.id))
      .where(
        and(
          eq(schema.leadActivities.id, validated.activityId),
          eq(schema.leadActivities.activityType, "VIEWING_APPOINTMENT"),
          isNull(schema.leadActivities.deletedAt),
        ),
      )
      .limit(1);

    const appointment = rows[0];

    if (!appointment) {
      return errorJson("Viewing appointment not found.", 404);
    }

    const isAgent = authContext.roleCode === "AGENT";

    if (isAgent && appointment.leadAssigneeUserId !== currentUserId) {
      return errorJson("Only the assigned agent can update this appointment.", 403);
    }

    const now = new Date();
    const config = getActionConfig(validated.action);
    const metadata = getMetadata(appointment.metadata);

    await db
      .update(schema.leadActivities)
      .set({
        completedAt: validated.action === "COMPLETE" ? now : null,
        metadata: {
          ...metadata,
          appointmentStatus: config.status,
          statusUpdatedAt: now.toISOString(),
          statusUpdatedByUserId: currentUserId,
        },
        updatedAt: now,
      })
      .where(eq(schema.leadActivities.id, appointment.activityId));

    await db.insert(schema.leadActivities).values({
      leadId: appointment.leadId,
      actorUserId: currentUserId,
      activityType: `APPOINTMENT_${config.status}`,
      title: config.title,
      body: config.body,
      visibilityScope: "INTERNAL",
      metadata: {
        appointmentActivityId: appointment.activityId,
        appointmentStatus: config.status,
      },
    });

    await db
      .update(schema.leads)
      .set({
        lastActivityAt: now,
        updatedAt: now,
      })
      .where(eq(schema.leads.id, appointment.leadId));

    return okJson({
      message: config.title,
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
