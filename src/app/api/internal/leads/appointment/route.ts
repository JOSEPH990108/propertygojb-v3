import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";

const createLeadAppointmentSchema = z.object({
  leadId: z.string().min(1, "Lead is required."),
  projectId: z.string().min(1, "Project is required."),
  scheduledAt: z.string().min(1, "Appointment date and time is required."),
  durationMinutes: z.coerce.number().int().min(15).max(480).default(60),
  locationText: z.string().trim().max(500).optional().default(""),
  note: z.string().trim().max(2000).optional().default(""),
});

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
      return errorJson("Only the assigned agent can create appointment.", 403);
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

    const insertedActivity = await db
      .insert(schema.leadActivities)
      .values({
        leadId: lead.id,
        actorUserId: currentUserId,
        activityType: "VIEWING_APPOINTMENT",
        title: "Viewing appointment scheduled",
        body: [
          `Project: ${projectName}`,
          `Location: ${validated.locationText || "To be confirmed"}`,
          validated.note ? `Note: ${validated.note}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
        dueAt: scheduledAt,
        completedAt: null,
        visibilityScope: "INTERNAL",
        metadata: {
          appointmentStatus: "SCHEDULED",
          projectId: project.id,
          projectName,
          locationText: validated.locationText || null,
          durationMinutes: validated.durationMinutes,
          note: validated.note || null,
          source: "LEAD_DETAIL",
        },
      })
      .returning({
        id: schema.leadActivities.id,
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

    return okJson({
      message: "Viewing appointment created successfully.",
      activityId: insertedActivity[0]?.id,
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
