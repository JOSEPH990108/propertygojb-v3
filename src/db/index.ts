import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

type QueryClient = ReturnType<typeof postgres>;

const globalForDb = globalThis as unknown as {
  queryClient?: QueryClient;
};

const queryClient =
  globalForDb.queryClient ??
  postgres(databaseUrl, {
    max: process.env.NODE_ENV === "production" ? 10 : 3,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.queryClient = queryClient;
}

export const db = drizzle(queryClient, { schema });

export type DatabaseClient = typeof db;

export { schema };
export * from "./schema";
