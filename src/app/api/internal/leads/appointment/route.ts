import { and, eq, isNull } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";
import { writeAuditLog } from "@/lib/audit/log";

const createLeadAppointmentSchema = z.object({
  activityId: z.string().min(1).optional().nullable(),
  leadId: z.string().min(1, "Lead is required."),
  projectId: z.string().min(1, "Project is required."),
  scheduledAt: z.string().min(1, "Appointment date and time is required."),
  durationMinutes: z.coerce.number().int().min(15).max(480).default(60),
  locationText: z.string().trim().max(500).optional().default(""),
  note: z.string().trim().max(2000).optional().default(""),
});

function getMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
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
    const validated = createLeadAppointmentSchema.parse(body);

    const scheduledAt = new Date(validated.scheduledAt);

    if (Number.isNaN(scheduledAt.getTime())) {
      return errorJson("Appointment date and time is invalid.", 400);
    }

    if (scheduledAt.getTime() < Date.now()) {
      return errorJson("Appointment date and time cannot be in the past.", 400);
    }

    const lead = await db.query.leads.findFirst({
      where: (table, { eq }) => eq(table.id, validated.leadId),
      columns: {
        id: true,
        fullName: true,
        currentStatus: true,
        currentAssigneeUserId: true,
      },
    });

    if (!lead) {
      return errorJson("Lead not found.", 404);
    }

    const isAgent = authContext.roleCode === "AGENT";

    if (isAgent && lead.currentAssigneeUserId !== currentUserId) {
      return errorJson("Only the assigned agent can create or update appointment.", 403);
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
    const projectName = project.displayName ?? project.name;

    const appointmentBody = [
      `Project: ${projectName}`,
      `Location: ${validated.locationText || "To be confirmed"}`,
      validated.note ? `Note: ${validated.note}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const appointmentMetadata = {
      appointmentStatus: "SCHEDULED",
      projectId: project.id,
      projectName,
      locationText: validated.locationText || null,
      durationMinutes: validated.durationMinutes,
      note: validated.note || null,
      source: "LEAD_DETAIL",
    };

    let activityId = validated.activityId ?? null;
    let mode: "created" | "updated" = "created";

    if (activityId) {
      const existingAppointment = await db
        .select({
          id: schema.leadActivities.id,
          leadId: schema.leadActivities.leadId,
          metadata: schema.leadActivities.metadata,
        })
        .from(schema.leadActivities)
        .where(
          and(
            eq(schema.leadActivities.id, activityId),
            eq(schema.leadActivities.leadId, lead.id),
            eq(schema.leadActivities.activityType, "VIEWING_APPOINTMENT"),
            isNull(schema.leadActivities.deletedAt),
          ),
        )
        .limit(1);

      const existing = existingAppointment[0];

      if (!existing) {
        return errorJson("Existing viewing appointment not found.", 404);
      }

      const existingStatus =
        getMetadata(existing.metadata).appointmentStatus ?? "SCHEDULED";

      if (!["REQUESTED", "SCHEDULED"].includes(String(existingStatus))) {
        return errorJson(
          "Only scheduled appointments can be updated. Create a new appointment or reopen it first.",
          400,
        );
      }

      await db
        .update(schema.leadActivities)
        .set({
          title: "Viewing appointment scheduled",
          body: appointmentBody,
          dueAt: scheduledAt,
          completedAt: null,
          metadata: {
            ...getMetadata(existing.metadata),
            ...appointmentMetadata,
            appointmentStatus: "SCHEDULED",
            confirmedAt:
              existingStatus === "REQUESTED"
                ? now.toISOString()
                : getMetadata(existing.metadata).confirmedAt,
            confirmedByUserId:
              existingStatus === "REQUESTED"
                ? currentUserId
                : getMetadata(existing.metadata).confirmedByUserId,
            updatedFrom: "LEAD_DETAIL",
            updatedAt: now.toISOString(),
          },
          updatedAt: now,
        })
        .where(eq(schema.leadActivities.id, activityId));

      mode = "updated";
    } else {
      const insertedActivity = await db
        .insert(schema.leadActivities)
        .values({
          leadId: lead.id,
          actorUserId: currentUserId,
          activityType: "VIEWING_APPOINTMENT",
          title: "Viewing appointment scheduled",
          body: appointmentBody,
          dueAt: scheduledAt,
          completedAt: null,
          visibilityScope: "INTERNAL",
          metadata: appointmentMetadata,
        })
        .returning({
          id: schema.leadActivities.id,
        });

      activityId = insertedActivity[0]?.id ?? null;
    }

    await db.insert(schema.leadActivities).values({
      leadId: lead.id,
      actorUserId: currentUserId,
      activityType:
        mode === "created"
          ? "VIEWING_APPOINTMENT_CREATED"
          : "VIEWING_APPOINTMENT_UPDATED",
      title:
        mode === "created"
          ? "Viewing appointment created"
          : "Viewing appointment updated",
      body:
        mode === "created"
          ? "A viewing appointment was scheduled."
          : "The viewing appointment details were updated.",
      visibilityScope: "INTERNAL",
      metadata: {
        appointmentActivityId: activityId,
        projectId: project.id,
        projectName,
        scheduledAt: scheduledAt.toISOString(),
      },
    });

    await db
      .update(schema.leads)
      .set({
        currentStatus: "APPOINTMENT_SET",
        lastActivityAt: now,
        updatedAt: now,
      })
      .where(eq(schema.leads.id, lead.id));

    if (lead.currentStatus !== "APPOINTMENT_SET") {
      await db.insert(schema.leadStatusHistory).values({
        leadId: lead.id,
        fromStatus: lead.currentStatus,
        toStatus: "APPOINTMENT_SET",
        changedByUserId: currentUserId,
        changedAt: now,
        reasonCode: "VIEWING_APPOINTMENT_CREATED",
        sourceEventType: "LEAD_APPOINTMENT",
      });
    }

    await writeAuditLog({
      actionType: mode === "created" ? "CREATE_APPOINTMENT" : "UPDATE_APPOINTMENT",
      entityType: "VIEWING_APPOINTMENT",
      entityId: activityId,
      actorUserId: currentUserId,
      sourceApp: authContext.roleCode === "AGENT" ? "AGENT_PORTAL" : "ADMIN_PORTAL",
      changeSummary:
        mode === "created"
          ? `Viewing appointment created for ${projectName}.`
          : `Viewing appointment confirmed or updated for ${projectName}.`,
      afterJson: {
        leadId: lead.id,
        projectId: project.id,
        appointmentStatus: "SCHEDULED",
        scheduledAt: scheduledAt.toISOString(),
        durationMinutes: validated.durationMinutes,
      },
      request,
    });

    return okJson({
      message:
        mode === "created"
          ? "Viewing appointment created successfully."
          : "Viewing appointment updated successfully.",
      activityId,
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
