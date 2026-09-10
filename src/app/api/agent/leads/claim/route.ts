import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";

const claimLeadSchema = z.object({
  leadId: z.string().min(1, "Lead is required."),
});

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireRole(["AGENT", "SUPER_ADMIN"], "/agent/leads");
    const currentUser = authContext.user as { id?: unknown };
    const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";

    if (!currentUserId) {
      return errorJson("Current user not found.", 401);
    }

    const body = await request.json();
    const validated = claimLeadSchema.parse(body);

    const lead = await db.query.leads.findFirst({
      where: (table, { eq }) => eq(table.id, validated.leadId),
      columns: {
        id: true,
        currentStatus: true,
        currentAssigneeUserId: true,
        firstAssignedAt: true,
      },
    });

    if (!lead) {
      return errorJson("Lead not found.", 404);
    }

    if (lead.currentAssigneeUserId && lead.currentAssigneeUserId !== currentUserId) {
      return errorJson("This lead has already been assigned to another agent.", 409);
    }

    if (lead.currentAssigneeUserId === currentUserId) {
      return okJson({
        message: "Lead is already assigned to you.",
      });
    }

    const now = new Date();

    let nextStatus = lead.currentStatus;

    if (
      lead.currentStatus === "NEW" ||
      lead.currentStatus === "UNCONTACTED" ||
      lead.currentStatus === "ASSIGNED"
    ) {
      nextStatus = "ASSIGNED";
    }

    await db
      .update(schema.leadAssignments)
      .set({
        isCurrent: false,
        effectiveTo: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(schema.leadAssignments.leadId, validated.leadId),
          eq(schema.leadAssignments.isCurrent, true),
        ),
      );

    const insertedAssignment = await db
      .insert(schema.leadAssignments)
      .values({
        leadId: validated.leadId,
        fromUserId: null,
        toUserId: currentUserId,
        assignedByUserId: currentUserId,
        assignmentType: "AGENT_CLAIM",
        reasonCode: "AGENT_CLAIM",
        reasonNote: "Agent claimed open public lead.",
        effectiveFrom: now,
        isCurrent: true,
      })
      .returning({
        id: schema.leadAssignments.id,
      });

    await db
      .update(schema.leads)
      .set({
        currentAssigneeUserId: currentUserId,
        currentStatus: nextStatus,
        firstAssignedAt: lead.firstAssignedAt ?? now,
        lastActivityAt: now,
        updatedAt: now,
      })
      .where(eq(schema.leads.id, validated.leadId));

    await db.insert(schema.leadActivities).values({
      leadId: validated.leadId,
      assignmentId: insertedAssignment[0]?.id,
      actorUserId: currentUserId,
      activityType: "LEAD_CLAIMED",
      title: "Lead claimed by agent",
      body: "Agent claimed this open public lead.",
      visibilityScope: "INTERNAL",
    });

    if (lead.currentStatus !== nextStatus) {
      await db.insert(schema.leadStatusHistory).values({
        leadId: validated.leadId,
        fromStatus: lead.currentStatus,
        toStatus: nextStatus,
        changedByUserId: currentUserId,
        changedAt: now,
        reasonCode: "AGENT_CLAIM",
        sourceEventType: "AGENT_LEAD_CLAIM",
      });
    }

    return okJson({
      message: "Lead claimed successfully.",
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
