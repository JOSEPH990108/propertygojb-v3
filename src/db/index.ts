// src\db\index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

const queryClient = databaseUrl
  ? postgres(databaseUrl, {
      max: 10,
    })
  : null;

export const db = queryClient ? drizzle(queryClient, { schema }) : null;

export type DatabaseClient = NonNullable<typeof db>;
export { schema };
export * from "./schema";
