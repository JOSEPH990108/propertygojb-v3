import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { auth } from "@/lib/auth/server";
import {
  parseMobileInput,
  registerRequestSchema,
} from "@/lib/auth/mobile-validation";
import {
  consumeAuthOtpChallenge,
  getVerifiedAuthOtpChallenge,
} from "@/lib/auth/otp-service";
import { createPhoneTempEmail } from "@/lib/auth/phone";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const challengeId =
      typeof body.challengeId === "string" ? body.challengeId : "";

    const validated = registerRequestSchema.parse(body);
    const phone = parseMobileInput(validated);

    const challenge = await getVerifiedAuthOtpChallenge({
      challengeId,
      phoneNormalized: phone.phoneNormalized,
      purpose: "REGISTER",
    });

    if (!challenge) {
      return errorJson("Please verify OTP before completing registration.", 400);
    }

    const existingVerifiedUser = await db.query.user.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.phoneNumber, phone.phoneNumber),
          eq(table.phoneNumberVerified, true),
        ),
      columns: {
        id: true,
      },
    });

    if (existingVerifiedUser) {
      return errorJson("This mobile number is already registered.", 409);
    }

    const role = await db.query.roles.findFirst({
      where: (table, { eq }) => eq(table.code, "CUSTOMER"),
      columns: {
        id: true,
      },
    });

    if (!role) {
      throw new Error("CUSTOMER role is required before public registration.");
    }

    const now = new Date();
    const userId = randomUUID();
    const accountId = randomUUID();
    const email = createPhoneTempEmail(phone.phoneNumber);

    const ctx = await auth.$context;
    const hashedPassword = await ctx.password.hash(validated.password);

    await db.transaction(async (tx) => {
      await tx.insert(schema.user).values({
        id: userId,
        name: validated.name.trim(),
        email,
        emailVerified: false,
        phoneNumber: phone.phoneNumber,
        phoneNumberVerified: true,
        roleId: role.id,
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(schema.account).values({
        id: accountId,
        accountId: userId,
        providerId: "credential",
        userId,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      });
    });

    await consumeAuthOtpChallenge(challenge.id);

    return okJson({
      message: "Registration completed successfully.",
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
