import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";

type DB = PostgresJsDatabase<typeof schema>;

const permissionGroupBaseline = [
  {
    code: "CATALOG",
    name: "Catalog",
    description: "Project and unit catalog operations.",
    sortOrder: 10,
  },
  {
    code: "LEADS",
    name: "Leads",
    description: "Lead intake, assignment, and status operations.",
    sortOrder: 20,
  },
  {
    code: "BOOKINGS",
    name: "Bookings",
    description: "Booking lifecycle and payment operations.",
    sortOrder: 30,
  },
  {
    code: "DOCUMENTS",
    name: "Documents",
    description: "Document request, verification, and secure access operations.",
    sortOrder: 40,
  },
  {
    code: "GOVERNANCE",
    name: "Governance",
    description: "RBAC governance, settings, feature flags, and audits.",
    sortOrder: 50,
  },
] as const;

export async function seedPermissionGroups(db: DB) {
  for (const group of permissionGroupBaseline) {
    await db
      .insert(schema.permissionGroups)
      .values({
        ...group,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: schema.permissionGroups.code,
        set: {
          name: group.name,
          description: group.description,
          sortOrder: group.sortOrder,
          isActive: true,
          deletedAt: null,
        },
      });
  }
}