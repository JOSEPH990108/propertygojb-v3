import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => {
      const trimmedValue = value?.trim();
      return trimmedValue ? trimmedValue : null;
    });

const updateAgentProfileSchema = z.object({
  userId: z.string().min(1, "Agent user is required."),
  renNumber: optionalText(50),
  agencyName: optionalText(100),
  referralCode: optionalText(50),
});

export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/agents");

    const body = await request.json();
    const validated = updateAgentProfileSchema.parse(body);

    const agentRole = await db.query.roles.findFirst({
      where: (table, { and, eq }) =>
        and(eq(table.code, "AGENT"), eq(table.isActive, true)),
      columns: {
        id: true,
      },
    });

    if (!agentRole) {
      return errorJson("Agent role is not available.", 400);
    }

    const targetUser = await db.query.user.findFirst({
      where: (table, { eq }) => eq(table.id, validated.userId),
      columns: {
        id: true,
        roleId: true,
      },
    });

    if (!targetUser) {
      return errorJson("User not found.", 404);
    }

    if (targetUser.roleId !== agentRole.id) {
      return errorJson("Only users with AGENT role can be updated here.", 400);
    }

    const referralCode = validated.referralCode;

    if (referralCode) {
      const existingReferralCodeUser = await db.query.user.findFirst({
        where: (table, { and, eq, ne }) =>
          and(
            eq(table.referralCode, referralCode),
            ne(table.id, validated.userId),
          ),
        columns: {
          id: true,
        },
      });

      if (existingReferralCodeUser) {
        return errorJson("Referral code is already used by another user.", 409);
      }
    }

    await db
      .update(schema.user)
      .set({
        renNumber: validated.renNumber,
        agencyName: validated.agencyName,
        referralCode: validated.referralCode,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, validated.userId));

    return okJson({
      message: "Agent profile updated successfully.",
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
