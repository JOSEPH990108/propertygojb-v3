import { and, eq, inArray } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";

const assignLeadSchema = z.object({
  leadId: z.string().min(1, "Lead is required."),
  assigneeUserId: z.string().min(1).nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/leads");
    const currentUser = authContext.user as { id?: unknown };
    const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";

    if (!currentUserId) {
      return errorJson("Current user not found.", 401);
    }

    const body = await request.json();
    const validated = assignLeadSchema.parse(body);

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

    if (validated.assigneeUserId) {
      const targetAgent = await db
        .select({
          id: schema.user.id,
          roleCode: schema.roles.code,
        })
        .from(schema.user)
        .innerJoin(schema.roles, eq(schema.user.roleId, schema.roles.id))
        .where(
          and(
            eq(schema.user.id, validated.assigneeUserId),
            inArray(schema.roles.code, ["AGENT", "SUPER_ADMIN"]),
          ),
        )
        .limit(1);

      if (!targetAgent[0]) {
        return errorJson("Selected user is not an agent.", 400);
      }
    }

    const now = new Date();
    const nextStatus = validated.assigneeUserId ? "ASSIGNED" : "UNCONTACTED";

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

    let assignmentId: string | null = null;

    if (validated.assigneeUserId) {
      const insertedAssignment = await db
        .insert(schema.leadAssignments)
        .values({
          leadId: validated.leadId,
          fromUserId: lead.currentAssigneeUserId,
          toUserId: validated.assigneeUserId,
          assignedByUserId: currentUserId,
          assignmentType: "MANUAL",
          reasonCode: "ADMIN_ASSIGN",
          reasonNote: "Assigned from admin lead inbox.",
          effectiveFrom: now,
          isCurrent: true,
        })
        .returning({
          id: schema.leadAssignments.id,
        });

      assignmentId = insertedAssignment[0]?.id ?? null;
    }

    await db
      .update(schema.leads)
      .set({
        currentAssigneeUserId: validated.assigneeUserId,
        currentStatus: nextStatus,
        firstAssignedAt:
          validated.assigneeUserId && !lead.firstAssignedAt
            ? now
            : lead.firstAssignedAt,
        lastActivityAt: now,
        updatedAt: now,
      })
      .where(eq(schema.leads.id, validated.leadId));

    await db.insert(schema.leadActivities).values({
      leadId: validated.leadId,
      assignmentId,
      actorUserId: currentUserId,
      activityType: validated.assigneeUserId ? "LEAD_ASSIGNED" : "LEAD_UNASSIGNED",
      title: validated.assigneeUserId ? "Lead assigned" : "Lead unassigned",
      body: validated.assigneeUserId
        ? "Lead was manually assigned from admin inbox."
        : "Lead was unassigned from admin inbox.",
      visibilityScope: "INTERNAL",
      metadata: {
        fromUserId: lead.currentAssigneeUserId,
        toUserId: validated.assigneeUserId,
      },
    });

    if (lead.currentStatus !== nextStatus) {
      await db.insert(schema.leadStatusHistory).values({
        leadId: validated.leadId,
        fromStatus: lead.currentStatus,
        toStatus: nextStatus,
        changedByUserId: currentUserId,
        changedAt: now,
        reasonCode: validated.assigneeUserId ? "ADMIN_ASSIGN" : "ADMIN_UNASSIGN",
        sourceEventType: "ADMIN_LEAD_ASSIGNMENT",
      });
    }

    return okJson({
      message: validated.assigneeUserId
        ? "Lead assigned successfully."
        : "Lead unassigned successfully.",
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
