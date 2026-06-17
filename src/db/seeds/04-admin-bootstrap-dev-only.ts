// src\db\seeds\04-admin-bootstrap-dev-only.ts
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";

type DB = PostgresJsDatabase<typeof schema>;

export async function seedAdminBootstrapDevOnly(db: DB) {
  if (process.env.APP_ENV !== "development") {
    return;
  }

  if (process.env.ALLOW_DEV_ADMIN_BOOTSTRAP !== "true") {
    return;
  }

  const superAdminRole = await db.query.roles.findFirst({
    where: (table, { eq }) => eq(table.code, "SUPER_ADMIN"),
  });

  if (!superAdminRole) {
    return;
  }

  const adminUserId = "dev-super-admin";
  const adminEmail = process.env.DEV_ADMIN_EMAIL;
  const devPasswordHash = process.env.DEV_ADMIN_PASSWORD_HASH;

  if (!adminEmail || !devPasswordHash) {
    return;
  }

  await db
    .insert(schema.user)
    .values({
      id: adminUserId,
      name: "Dev Super Admin",
      email: adminEmail,
      roleId: superAdminRole.id,
      emailVerified: true,
      onboardingCompleted: true,
    })
    .onConflictDoNothing();

  await db
    .insert(schema.account)
    .values({
      id: "dev-super-admin-account",
      accountId: adminUserId,
      providerId: "credential",
      userId: adminUserId,
      password: devPasswordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing();
}
