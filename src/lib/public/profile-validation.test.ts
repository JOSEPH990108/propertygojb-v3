import { describe, expect, it } from "vitest";

import {
  customerPhoneConfirmSchema,
  customerProfileSchema,
  isPhonePlaceholderEmail,
} from "./profile-validation";

describe("customerProfileSchema", () => {
  it("trims profile details and normalizes an empty nationality", () => {
    expect(
      customerProfileSchema.parse({ name: "  Jane Customer  ", nationality: " " }),
    ).toEqual({ name: "Jane Customer", nationality: null });
  });

  it("rejects invalid names", () => {
    expect(() => customerProfileSchema.parse({ name: "J", nationality: "" })).toThrow();
  });
});

describe("customerPhoneConfirmSchema", () => {
  it("requires a supported mobile number and six-digit code", () => {
    expect(
      customerPhoneConfirmSchema.safeParse({
        countryCode: "+60",
        mobile: "10 460-8699",
        code: "123456",
      }).success,
    ).toBe(true);

    expect(
      customerPhoneConfirmSchema.safeParse({
        countryCode: "+60",
        mobile: "10 460-8699",
        code: "12345",
      }).success,
    ).toBe(false);
  });
});

describe("isPhonePlaceholderEmail", () => {
  it("distinguishes generated login addresses from customer email", () => {
    expect(isPhonePlaceholderEmail("60104608699@phone.propertygojb.local")).toBe(true);
    expect(isPhonePlaceholderEmail("customer@example.com")).toBe(false);
  });
});