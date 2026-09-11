import { and, eq, isNull } from "drizzle-orm";
import { NextRequest } from "next/server";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { writeAuditLog } from "@/lib/audit/log";
import { requireRole } from "@/lib/auth/guards";
import { parseMobileInput } from "@/lib/auth/mobile-validation";
import {
  getVerifiedAuthOtpChallenge,
  verifyAuthOtpChallenge,
} from "@/lib/auth/otp-service";
import { createPhoneTempEmail } from "@/lib/auth/phone";
import {
  customerPhoneConfirmSchema,
  isPhonePlaceholderEmail,
} from "@/lib/public/profile-validation";

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireRole(["CUSTOMER"], "/account/profile");
    const userId = (authContext.user as { id?: string }).id;

    if (!userId) {
      return errorJson("Authenticated customer identity is missing.", 401);
    }

    const validated = customerPhoneConfirmSchema.parse(await request.json());
    const phone = parseMobileInput(validated);
    const verification = await verifyAuthOtpChallenge({
      phoneNumber: phone.phoneNumber,
      phoneNormalized: phone.phoneNormalized,
      purpose: "PHONE_CHANGE",
      code: validated.code,
      userId,
    });

    if (!verification.ok) {
      return errorJson(verification.message, 400);
    }

    const challenge = await getVerifiedAuthOtpChallenge({
      challengeId: verification.challengeId,
      phoneNormalized: phone.phoneNormalized,
      purpose: "PHONE_CHANGE",
      userId,
    });

    if (!challenge) {
      return errorJson("Please request and verify a new code.", 400);
    }

    const [currentUser, phoneOwner, conflictingLead] = await Promise.all([
      db.query.user.findFirst({
        where: (table, { eq }) => eq(table.id, userId),
        columns: { id: true, phoneNumber: true, email: true },
      }),
      db.query.user.findFirst({
        where: (table, { and, eq, ne }) =>
          and(eq(table.phoneNumber, phone.phoneNumber), ne(table.id, userId)),
        columns: { id: true },
      }),
      db.query.leads.findFirst({
        where: (table, { and, eq, isNull, ne, or }) =>
          and(
            eq(table.primaryPhoneNormalized, phone.phoneNormalized),
            isNull(table.deletedAt),
            or(isNull(table.customerUserId), ne(table.customerUserId, userId)),
          ),
        columns: { id: true },
      }),
    ]);

    if (!currentUser) {
      return errorJson("Customer account was not found.", 404);
    }

    if (phoneOwner) {
      return errorJson("This mobile number is already registered.", 409);
    }

    if (conflictingLead) {
      return errorJson(
        "This mobile number is linked to another customer record. Contact support for help.",
        409,
      );
    }

    const now = new Date();
    const placeholderEmail = isPhonePlaceholderEmail(currentUser.email)
      ? createPhoneTempEmail(phone.phoneNumber)
      : currentUser.email;

    await db.transaction(async (tx) => {
      await tx
        .update(schema.user)
        .set({
          phoneNumber: phone.phoneNumber,
          phoneNumberVerified: true,
          email: placeholderEmail,
          updatedAt: now,
        })
        .where(eq(schema.user.id, userId));

      await tx
        .update(schema.leads)
        .set({
          primaryPhoneE164: phone.phoneNumber,
          primaryPhoneNormalized: phone.phoneNormalized,
          updatedAt: now,
        })
        .where(
          and(
            eq(schema.leads.customerUserId, userId),
            isNull(schema.leads.deletedAt),
          ),
        );

      await tx
        .update(schema.otpChallenges)
        .set({ consumedAt: now, updatedAt: now })
        .where(eq(schema.otpChallenges.id, challenge.id));
    });

    await writeAuditLog({
      actionType: "CONFIRM_PHONE_CHANGE",
      entityType: "CUSTOMER_PROFILE",
      entityId: userId,
      actorUserId: userId,
      actorRoleId: authContext.roleId,
      sourceApp: "CUSTOMER_PORTAL",
      changeSummary: "Customer changed and reverified their mobile number.",
      beforeJson: { phoneNumber: currentUser.phoneNumber },
      afterJson: { phoneNumber: phone.phoneNumber, phoneNumberVerified: true },
      request,
    });

    return okJson({ message: "Mobile number updated and verified." });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}