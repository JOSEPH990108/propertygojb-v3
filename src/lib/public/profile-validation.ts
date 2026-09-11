import { z } from "zod";

import { mobileInputSchema, otpCodeSchema } from "../auth/mobile-validation";

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .transform((value) => value || null);

export const customerProfileSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(150),
  nationality: optionalText(100),
});

export const customerPhoneRequestSchema = mobileInputSchema;

export const customerPhoneConfirmSchema = mobileInputSchema.extend({
  code: otpCodeSchema,
});

export function isPhonePlaceholderEmail(email: string) {
  return /^\d+@phone\.propertygojb\.local$/i.test(email);
}