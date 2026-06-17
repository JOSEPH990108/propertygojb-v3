import { NextRequest } from "next/server";

import { db } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import {
  forgotPasswordRequestSchema,
  parseMobileInput,
} from "@/lib/auth/mobile-validation";
import { createAuthOtpChallenge } from "@/lib/auth/otp-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = forgotPasswordRequestSchema.parse(body);
    const phone = parseMobileInput(validated);

    const user = await db.query.user.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.phoneNumber, phone.phoneNumber),
          eq(table.phoneNumberVerified, true),
        ),
      columns: {
        id: true,
      },
    });

    if (!user) {
      return errorJson("No account found with this mobile number.", 404);
    }

    await createAuthOtpChallenge({
      phoneNumber: phone.phoneNumber,
      phoneNormalized: phone.phoneNormalized,
      purpose: "PASSWORD_RESET",
      userId: user.id,
    });

    return okJson({
      message: "Password reset OTP sent successfully.",
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
