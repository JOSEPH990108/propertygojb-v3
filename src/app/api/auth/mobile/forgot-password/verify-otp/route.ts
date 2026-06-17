import { NextRequest } from "next/server";

import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { otpVerifySchema, parseMobileInput } from "@/lib/auth/mobile-validation";
import { verifyAuthOtpChallenge } from "@/lib/auth/otp-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = otpVerifySchema.parse(body);
    const phone = parseMobileInput(validated);

    const result = await verifyAuthOtpChallenge({
      phoneNumber: phone.phoneNumber,
      phoneNormalized: phone.phoneNormalized,
      purpose: "PASSWORD_RESET",
      code: validated.code,
    });

    if (!result.ok) {
      return errorJson(result.message, 400);
    }

    return okJson({
      challengeId: result.challengeId,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
