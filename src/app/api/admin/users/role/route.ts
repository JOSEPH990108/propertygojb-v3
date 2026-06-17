import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";

const updateUserRoleSchema = z.object({
  userId: z.string().min(1, "User is required."),
  roleCode: z.enum(["CUSTOMER", "AGENT", "ADMIN", "SUPER_ADMIN"]),
});

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/users");
    const currentUser = authContext.user as { id?: unknown };

    const body = await request.json();
    const validated = updateUserRoleSchema.parse(body);

    if (currentUser.id === validated.userId) {
      return errorJson("You cannot change your own role from this page.", 400);
    }

    const role = await db.query.roles.findFirst({
      where: (table, { and, eq }) =>
        and(eq(table.code, validated.roleCode), eq(table.isActive, true)),
      columns: {
        id: true,
        code: true,
      },
    });

    if (!role) {
      return errorJson("Selected role is not available.", 400);
    }

    const targetUser = await db.query.user.findFirst({
      where: (table, { eq }) => eq(table.id, validated.userId),
      columns: {
        id: true,
      },
    });

    if (!targetUser) {
      return errorJson("User not found.", 404);
    }

    await db
      .update(schema.user)
      .set({
        roleId: role.id,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, validated.userId));

    return okJson({
      message: "User role updated successfully.",
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
