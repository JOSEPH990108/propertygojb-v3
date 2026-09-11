import { and, eq, isNull } from "drizzle-orm";
import { NextRequest } from "next/server";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { writeAuditLog } from "@/lib/audit/log";
import { requireRole } from "@/lib/auth/guards";
import { customerProfileSchema } from "@/lib/public/profile-validation";

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireRole(["CUSTOMER"], "/account/profile");
    const userId = (authContext.user as { id?: string }).id;

    if (!userId) {
      return errorJson("Authenticated customer identity is missing.", 401);
    }

    const validated = customerProfileSchema.parse(await request.json());
    const currentUser = await db.query.user.findFirst({
      where: (table, { eq }) => eq(table.id, userId),
      columns: { name: true, nationality: true },
    });

    if (!currentUser) {
      return errorJson("Customer account was not found.", 404);
    }

    const now = new Date();

    await db.transaction(async (tx) => {
      await tx
        .update(schema.user)
        .set({
          name: validated.name,
          nationality: validated.nationality,
          updatedAt: now,
        })
        .where(eq(schema.user.id, userId));

      await tx
        .update(schema.leads)
        .set({
          fullName: validated.name,
          nationality: validated.nationality,
          updatedAt: now,
        })
        .where(
          and(
            eq(schema.leads.customerUserId, userId),
            isNull(schema.leads.deletedAt),
          ),
        );
    });

    await writeAuditLog({
      actionType: "UPDATE_PROFILE",
      entityType: "CUSTOMER_PROFILE",
      entityId: userId,
      actorUserId: userId,
      actorRoleId: authContext.roleId,
      sourceApp: "CUSTOMER_PORTAL",
      changeSummary: "Customer updated profile details.",
      beforeJson: currentUser,
      afterJson: validated,
      request,
    });

    return okJson({ message: "Profile updated successfully." });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}