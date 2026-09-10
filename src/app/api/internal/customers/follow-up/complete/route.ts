import { and, eq, isNull } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";

const completeFollowUpSchema = z.object({
  activityId: z.string().min(1, "Follow-up task is required."),
});

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireRole(
      ["ADMIN", "SUPER_ADMIN", "AGENT"],
      "/admin/follow-ups",
    );

    const currentUser = authContext.user as { id?: unknown };
    const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";

    if (!currentUserId) {
      return errorJson("Current user not found.", 401);
    }

    const body = await request.json();
    const validated = completeFollowUpSchema.parse(body);

    const followUp = await db
      .select({
        activityId: schema.leadActivities.id,
        leadId: schema.leadActivities.leadId,
        completedAt: schema.leadActivities.completedAt,
        customerAssigneeUserId: schema.leads.currentAssigneeUserId,
      })
      .from(schema.leadActivities)
      .innerJoin(schema.leads, eq(schema.leadActivities.leadId, schema.leads.id))
      .where(
        and(
          eq(schema.leadActivities.id, validated.activityId),
          eq(schema.leadActivities.activityType, "CUSTOMER_FOLLOW_UP"),
          isNull(schema.leads.deletedAt),
        ),
      )
      .limit(1);

    const record = followUp[0];

    if (!record) {
      return errorJson("Follow-up task not found.", 404);
    }

    const canManageAll =
      authContext.roleCode === "ADMIN" || authContext.roleCode === "SUPER_ADMIN";

    if (!canManageAll && record.customerAssigneeUserId !== currentUserId) {
      return errorJson("You can only complete assigned follow-up tasks.", 403);
    }

    if (record.completedAt) {
      return okJson({
        message: "Follow-up task already completed.",
        activityId: record.activityId,
      });
    }

    const now = new Date();

    await db
      .update(schema.leadActivities)
      .set({
        completedAt: now,
      })
      .where(eq(schema.leadActivities.id, record.activityId));

    await db.insert(schema.leadActivities).values({
      leadId: record.leadId,
      actorUserId: currentUserId,
      activityType: "CUSTOMER_FOLLOW_UP_COMPLETED",
      title: "Customer follow-up completed",
      body: "Follow-up task was marked as completed.",
      visibilityScope: "INTERNAL",
      completedAt: now,
      metadata: {
        source: "FOLLOW_UP_CENTER",
        completedActivityId: record.activityId,
      },
    });

    return okJson({
      message: "Follow-up task completed.",
      activityId: record.activityId,
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
