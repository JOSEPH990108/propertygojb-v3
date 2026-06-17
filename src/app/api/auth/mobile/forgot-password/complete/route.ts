import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { auth } from "@/lib/auth/server";
import {
  forgotPasswordCompleteSchema,
  parseMobileInput,
} from "@/lib/auth/mobile-validation";
import {
  consumeAuthOtpChallenge,
  getVerifiedAuthOtpChallenge,
} from "@/lib/auth/otp-service";

type PasswordContext = {
  hash: (password: string) => Promise<string>;
  verify: (data: { hash: string; password: string }) => Promise<boolean>;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = forgotPasswordCompleteSchema.parse(body);
    const phone = parseMobileInput(validated);

    const challenge = await getVerifiedAuthOtpChallenge({
      challengeId: validated.challengeId,
      phoneNormalized: phone.phoneNormalized,
      purpose: "PASSWORD_RESET",
    });

    const challengeUserId = challenge?.userId;

    if (!challengeUserId) {
      return errorJson("Please verify OTP before resetting password.", 400);
    }

    const account = await db.query.account.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.userId, challengeUserId),
          eq(table.providerId, "credential"),
        ),
      columns: {
        id: true,
        password: true,
      },
    });

    if (!account?.password) {
      return errorJson("This account does not have password login enabled.", 400);
    }

    const ctx = await auth.$context;
    const passwordService = ctx.password as PasswordContext;

    const isSamePassword = await passwordService.verify({
      hash: account.password,
      password: validated.newPassword,
    });

    if (isSamePassword) {
      return errorJson("New password cannot be the same as your current password.", 400);
    }

    const hashedPassword = await passwordService.hash(validated.newPassword);

    await db
      .update(schema.account)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(schema.account.id, account.id));

    await consumeAuthOtpChallenge(challenge.id);

    return okJson({
      message: "Password reset successfully.",
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
