import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";

const createCustomerNoteSchema = z.object({
  customerId: z.string().min(1, "Customer is required."),
  note: z.string().trim().min(1, "Note is required.").max(3000),
});

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireRole(
      ["ADMIN", "SUPER_ADMIN", "AGENT"],
      "/admin/customers",
    );

    const currentUser = authContext.user as { id?: unknown };
    const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";

    if (!currentUserId) {
      return errorJson("Current user not found.", 401);
    }

    const body = await request.json();
    const validated = createCustomerNoteSchema.parse(body);

    const customer = await db.query.leads.findFirst({
      where: (table, { and, eq, isNull }) =>
        and(eq(table.id, validated.customerId), isNull(table.deletedAt)),
      columns: {
        id: true,
        fullName: true,
        primaryPhoneE164: true,
        primaryPhoneNormalized: true,
        currentAssigneeUserId: true,
      },
    });

    if (!customer) {
      return errorJson("Customer not found.", 404);
    }

    const canManageAll =
      authContext.roleCode === "ADMIN" || authContext.roleCode === "SUPER_ADMIN";

    if (!canManageAll && customer.currentAssigneeUserId !== currentUserId) {
      return errorJson("You can only add notes for assigned customers.", 403);
    }

    await db.insert(schema.leadActivities).values({
      leadId: customer.id,
      actorUserId: currentUserId,
      activityType: "CUSTOMER_NOTE",
      title: "Customer note added",
      body: validated.note,
      visibilityScope: "INTERNAL",
      metadata: {
        source: "CUSTOMER_DETAIL",
        customerName:
          customer.fullName ??
          customer.primaryPhoneE164 ??
          customer.primaryPhoneNormalized ??
          null,
      },
    });

    return okJson({
      message: "Customer note added successfully.",
      customerId: customer.id,
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
