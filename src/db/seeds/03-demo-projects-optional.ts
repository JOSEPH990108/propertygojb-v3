// src\db\seeds\03-demo-projects-optional.ts
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";

type DB = PostgresJsDatabase<typeof schema>;

export async function seedDemoProjectsOptional(db: DB) {
  const isDemoEnabled = process.env.ENABLE_DEMO_PROJECT_SEED === "true";

  if (!isDemoEnabled) {
    return;
  }

  const developer = await db.query.developers.findFirst({
    where: (table, { eq }) => eq(table.slug, "demo-developer"),
  });

  const projectStatus = await db.query.projectStatuses.findFirst({
    where: (table, { eq }) => eq(table.code, "NEW_LAUNCH"),
  });

  const tenureType = await db.query.tenureTypes.findFirst({
    where: (table, { eq }) => eq(table.code, "FREEHOLD"),
  });

  if (!developer || !projectStatus || !tenureType) {
    return;
  }

  await db
    .insert(schema.projects)
    .values({
      slug: "demo-project-optional",
      name: "Demo Optional Project",
      developerId: developer.id,
      projectStatusId: projectStatus.id,
      tenureTypeId: tenureType.id,
    })
    .onConflictDoNothing();
}
