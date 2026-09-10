import "server-only";

import { cache } from "react";
import { asc, isNull } from "drizzle-orm";

import { db, schema } from "@/db";

/** All active area names for public lead-capture forms, alphabetically sorted. */
export const getPublicAreaNames = cache(async (): Promise<string[]> => {
  const rows = await db
    .select({ name: schema.areas.name })
    .from(schema.areas)
    .where(isNull(schema.areas.deletedAt))
    .orderBy(asc(schema.areas.name));

  return Array.from(new Set(rows.map((row) => row.name)));
});
