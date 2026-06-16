import { loadEnvConfig } from "@next/env";
import { runAllSeeds } from "./index";

async function main() {
  loadEnvConfig(process.cwd());

  const databaseUrl = process.env.DATABASE_URL;
  const appEnv = process.env.APP_ENV ?? process.env.NODE_ENV;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing.");
  }

  if (appEnv !== "development") {
    throw new Error("Seeding is allowed only when APP_ENV is development.");
  }

  await runAllSeeds(databaseUrl);
  console.log("Database seeds completed successfully.");
}

main().catch((error: unknown) => {
  console.error("Database seeding failed.", error);
  process.exit(1);
});
