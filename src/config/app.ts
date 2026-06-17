export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "PropertyGoJB",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  env: process.env.NEXT_PUBLIC_APP_ENV ?? "local",
} as const;

export type AppEnv = "local" | "uat1" | "uat2" | "preprod" | "prod";

export function isProduction() {
  return appConfig.env === "prod";
}

export function isUat() {
  return appConfig.env === "uat1" || appConfig.env === "uat2";
}
