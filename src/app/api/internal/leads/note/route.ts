import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";

const leadNoteSchema = z.object({
  leadId: z.string().min(1, "Lead is required."),
  note: z.string().trim().min(1, "Note is required.").max(2000),
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
    const validated = leadNoteSchema.parse(body);

    const lead = await db.query.leads.findFirst({
      where: (table, { eq }) => eq(table.id, validated.leadId),
      columns: {
        id: true,
        currentAssigneeUserId: true,
      },
    });

    if (!lead) {
      return errorJson("Lead not found.", 404);
    }

    const isAgent = authContext.roleCode === "AGENT";

    if (isAgent && lead.currentAssigneeUserId !== currentUserId) {
      return errorJson("Only the assigned agent can add notes to this lead.", 403);
    }

    const now = new Date();

    await db.insert(schema.leadActivities).values({
      leadId: validated.leadId,
      actorUserId: currentUserId,
      activityType: "NOTE",
      title: "Internal note",
      body: validated.note,
      visibilityScope: "INTERNAL",
    });

    await db
      .update(schema.leads)
      .set({
        lastActivityAt: now,
        updatedAt: now,
      })
      .where(eq(schema.leads.id, validated.leadId));

    return okJson({
      message: "Note added successfully.",
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
