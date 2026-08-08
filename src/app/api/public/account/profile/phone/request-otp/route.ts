import { NextRequest } from "next/server";

import { db } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { writeAuditLog } from "@/lib/audit/log";
import { requireRole } from "@/lib/auth/guards";
import { parseMobileInput } from "@/lib/auth/mobile-validation";
import { createAuthOtpChallenge } from "@/lib/auth/otp-service";
import { customerPhoneRequestSchema } from "@/lib/public/profile-validation";

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireRole(["CUSTOMER"], "/account/profile");
    const userId = (authContext.user as { id?: string }).id;

    if (!userId) {
      return errorJson("Authenticated customer identity is missing.", 401);
    }

    const validated = customerPhoneRequestSchema.parse(await request.json());
    const phone = parseMobileInput(validated);
    const [currentUser, phoneOwner, activeChallenge] = await Promise.all([
      db.query.user.findFirst({
        where: (table, { eq }) => eq(table.id, userId),
        columns: { id: true, phoneNumber: true },
      }),
      db.query.user.findFirst({
        where: (table, { eq }) => eq(table.phoneNumber, phone.phoneNumber),
        columns: { id: true },
      }),
      db.query.otpChallenges.findFirst({
        where: (table, { and, eq, isNull }) =>
          and(
            eq(table.userId, userId),
            eq(table.purpose, "PHONE_CHANGE"),
            isNull(table.consumedAt),
            isNull(table.lockedAt),
          ),
        columns: { phoneNormalized: true, resendAvailableAt: true },
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      }),
    ]);

    if (!currentUser) {
      return errorJson("Customer account was not found.", 404);
    }

    if (currentUser.phoneNumber === phone.phoneNumber) {
      return errorJson("Enter a different mobile number.", 400);
    }

    if (phoneOwner && phoneOwner.id !== userId) {
      return errorJson("This mobile number is already registered.", 409);
    }

    if (
      activeChallenge &&
      activeChallenge.phoneNormalized !== phone.phoneNormalized &&
      activeChallenge.resendAvailableAt.getTime() > Date.now()
    ) {
      return errorJson("Wait before requesting a code for another number.", 429);
    }

    const challenge = await createAuthOtpChallenge({
      phoneNumber: phone.phoneNumber,
      phoneNormalized: phone.phoneNormalized,
      purpose: "PHONE_CHANGE",
      userId,
      metadata: { previousPhoneNumber: currentUser.phoneNumber },
    });

    await writeAuditLog({
      actionType: "REQUEST_PHONE_CHANGE",
      entityType: "CUSTOMER_PROFILE",
      entityId: userId,
      actorUserId: userId,
      actorRoleId: authContext.roleId,
      sourceApp: "CUSTOMER_PORTAL",
      changeSummary: "Customer requested mobile number reverification.",
      request,
    });

    return okJson({
      message: "Verification code sent.",
      expiresAt: challenge.expiresAt.toISOString(),
      resendAvailableAt: challenge.resendAvailableAt.toISOString(),
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}