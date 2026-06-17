import "server-only";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { phoneNumber } from "better-auth/plugins";

import { db, schema } from "@/db";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is required.");
}

function createPhoneTempEmail(phone: string) {
  const normalized = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  return `${normalized}@phone.propertygojb.local`;
}

export const auth = betterAuth({
  appName: "PropertyGoJB",
  basePath: "/api/auth",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  emailAndPassword: {
    enabled: true,
  },

  socialProviders:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : undefined,

  plugins: [
    phoneNumber({
      otpLength: 6,
      expiresIn: 300,
      sendOTP: ({ phoneNumber, code }) => {
        // DEV ONLY: Replace with real SMS provider later.
        console.log(`[DEV PHONE OTP] ${phoneNumber}: ${code}`);
      },
      sendPasswordResetOTP: ({ phoneNumber, code }) => {
        console.log(`[DEV PASSWORD RESET OTP] ${phoneNumber}: ${code}`);
      },
      signUpOnVerification: {
        getTempEmail: (phoneNumber) => createPhoneTempEmail(phoneNumber),
        getTempName: (phoneNumber) => phoneNumber,
      },
    }),
    nextCookies(),
  ],
});
