import { loadEnvConfig } from "@next/env";

import { runStagingBootstrap } from "./staging-bootstrap";

async function main() {
  loadEnvConfig(process.cwd());

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing.");
  }

  if (process.env.APP_ENV !== "staging") {
    throw new Error("Staging bootstrap is allowed only when APP_ENV is staging.");
  }

  if (process.env.CONFIRM_STAGING_BOOTSTRAP !== "true") {
    throw new Error("Set CONFIRM_STAGING_BOOTSTRAP=true to run the staging bootstrap.");
  }

  await runStagingBootstrap(databaseUrl);
  console.log("Staging bootstrap completed successfully.");
}

main().catch((error: unknown) => {
  console.error("Staging bootstrap failed.", error);
  process.exit(1);
});