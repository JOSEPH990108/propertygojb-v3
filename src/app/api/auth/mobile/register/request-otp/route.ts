import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import {
  parseMobileInput,
  registerRequestSchema,
} from "@/lib/auth/mobile-validation";
import { createAuthOtpChallenge } from "@/lib/auth/otp-service";
import { createPhoneTempEmail } from "@/lib/auth/phone";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerRequestSchema.parse(body);
    const phone = parseMobileInput(validated);

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

    const tempEmail = createPhoneTempEmail(phone.phoneNumber);

    const staleUnverifiedUser = await db.query.user.findFirst({
      where: (table, { and, eq, or }) =>
        and(
          eq(table.phoneNumberVerified, false),
          or(eq(table.phoneNumber, phone.phoneNumber), eq(table.email, tempEmail)),
        ),
      columns: {
        id: true,
      },
    });

    if (staleUnverifiedUser) {
      await db.delete(schema.user).where(eq(schema.user.id, staleUnverifiedUser.id));
    }

    await createAuthOtpChallenge({
      phoneNumber: phone.phoneNumber,
      phoneNormalized: phone.phoneNormalized,
      purpose: "REGISTER",
      metadata: {
        name: validated.name.trim(),
      },
    });

    return okJson({
      message: "OTP sent successfully.",
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
