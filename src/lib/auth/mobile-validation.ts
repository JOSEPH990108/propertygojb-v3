import { z } from "zod";

import { normalizeLocalPhoneNumber } from "@/lib/auth/phone";
import { isPasswordValid } from "@/lib/auth/password-policy";

export const countryCodeSchema = z.enum(["+60", "+65", "+62", "+66", "+91"]);

export const mobileInputSchema = z.object({
  countryCode: countryCodeSchema,
  mobile: z
    .string()
    .trim()
    .min(6, "Mobile number is too short.")
    .max(20, "Mobile number is too long.")
    .regex(/^[\d\s-]+$/, "Mobile number can only contain digits, spaces, or dashes."),
});

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Please enter a valid 6-digit OTP.");

export const authPasswordSchema = z
  .string()
  .refine(isPasswordValid, "Password does not meet the requirements.");

export const registerRequestSchema = mobileInputSchema.extend({
  name: z.string().trim().min(2, "Name is required."),
  password: authPasswordSchema,
});

export const forgotPasswordRequestSchema = mobileInputSchema;

export const otpVerifySchema = mobileInputSchema.extend({
  code: otpCodeSchema,
});

export const forgotPasswordCompleteSchema = mobileInputSchema.extend({
  challengeId: z.string().min(1, "OTP verification is required."),
  newPassword: authPasswordSchema,
});

export function parseMobileInput(input: unknown) {
  const parsed = mobileInputSchema.parse(input);
  const localNumber = normalizeLocalPhoneNumber(parsed.mobile);
  const phoneNumber = `${parsed.countryCode}${localNumber}`;

  const e164 = z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, "Please enter a valid mobile number.")
    .parse(phoneNumber);

  return {
    ...parsed,
    localNumber,
    phoneNumber: e164,
    phoneNormalized: e164.replace(/\D/g, ""),
  };
}
