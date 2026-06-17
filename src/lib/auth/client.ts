import { createAuthClient } from "better-auth/react";
import { phoneNumberClient } from "better-auth/client/plugins";

const betterAuthBaseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

export const authClient = createAuthClient({
  ...(betterAuthBaseUrl ? { baseURL: betterAuthBaseUrl } : {}),
  basePath: "/api/auth",
  plugins: [phoneNumberClient()],
});
