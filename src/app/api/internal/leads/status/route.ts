import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";

const leadStatusSchema = z.object({
  leadId: z.string().min(1, "Lead is required."),
  status: z.enum([
    "NEW",
    "UNCONTACTED",
    "ASSIGNED",
    "CONTACTED",
    "QUALIFIED",
    "APPOINTMENT_SET",
    "NURTURING",
    "LOST",
    "SPAM",
    "CLOSED",
  ]),
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
    const validated = leadStatusSchema.parse(body);

    const lead = await db.query.leads.findFirst({
      where: (table, { eq }) => eq(table.id, validated.leadId),
      columns: {
        id: true,
        currentStatus: true,
        currentAssigneeUserId: true,
      },
    });

    if (!lead) {
      return errorJson("Lead not found.", 404);
    }

    const isAgent = authContext.roleCode === "AGENT";

    if (isAgent && lead.currentAssigneeUserId !== currentUserId) {
      return errorJson("Only the assigned agent can update this lead.", 403);
    }

    if (lead.currentStatus === validated.status) {
      return okJson({
        message: "Lead status is already up to date.",
      });
    }

    const now = new Date();

    await db
      .update(schema.leads)
      .set({
        currentStatus: validated.status,
        lastActivityAt: now,
        updatedAt: now,
      })
      .where(eq(schema.leads.id, validated.leadId));

    await db.insert(schema.leadStatusHistory).values({
      leadId: validated.leadId,
      fromStatus: lead.currentStatus,
      toStatus: validated.status,
      changedByUserId: currentUserId,
      changedAt: now,
      reasonCode: "MANUAL_STATUS_UPDATE",
      sourceEventType: "LEAD_DETAIL",
    });

    await db.insert(schema.leadActivities).values({
      leadId: validated.leadId,
      actorUserId: currentUserId,
      activityType: "STATUS_UPDATED",
      title: "Lead status updated",
      body: `Status changed from ${lead.currentStatus} to ${validated.status}.`,
      visibilityScope: "INTERNAL",
      metadata: {
        fromStatus: lead.currentStatus,
        toStatus: validated.status,
      },
    });

    return okJson({
      message: "Lead status updated successfully.",
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
