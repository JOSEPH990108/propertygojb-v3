import "server-only";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { phoneNumber } from "better-auth/plugins";

import { db, schema } from "@/db";
import { createPhoneTempEmail } from "@/lib/auth/phone";

const isProduction = process.env.NODE_ENV === "production";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is required.");
}

function getBetterAuthBaseUrl() {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }

  if (!isProduction) {
    return "http://localhost:3000";
  }

  throw new Error("BETTER_AUTH_URL is required in production.");
}

async function getCustomerRoleId() {
  const role = await db.query.roles.findFirst({
    where: (table, { eq }) => eq(table.code, "CUSTOMER"),
    columns: { id: true },
  });

  if (!role) {
    throw new Error("CUSTOMER role is required before public registration.");
  }

  return role.id;
}

export const auth = betterAuth({
  appName: "PropertyGoJB",
  basePath: "/api/auth",
  baseURL: getBetterAuthBaseUrl(),
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

  user: {
    additionalFields: {
      roleId: {
        type: "string",
        required: false,
        input: false,
        returned: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        async before(user) {
          return {
            data: {
              ...user,
              roleId: await getCustomerRoleId(),
            },
          };
        },
      },
    },
  },

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
        if (isProduction) {
          throw new Error("sendOTP SMS provider is not configured.");
        }

        console.log(`[DEV PHONE OTP] ${phoneNumber}: ${code}`);
      },
      sendPasswordResetOTP: ({ phoneNumber, code }) => {
        if (isProduction) {
          throw new Error("sendPasswordResetOTP SMS provider is not configured.");
        }

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
