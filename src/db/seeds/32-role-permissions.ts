import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";

type DB = PostgresJsDatabase<typeof schema>;

const superAdminRoleCode = "SUPER_ADMIN";
const adminRoleCode = "ADMIN";
const agentRoleCode = "AGENT";
const customerRoleCode = "CUSTOMER";

const governanceReadPermissionCodes = new Set([
  "AUDIT_READ",
  "FEATURE_FLAG_READ",
  "SYSTEM_SETTING_READ",
]);

const agentPermissionCodes = new Set([
  "PROJECT_READ",
  "UNIT_READ",
  "LEAD_READ",
  "LEAD_UPDATE_STATUS",
  "LEAD_ACTIVITY_CREATE",
  "BOOKING_READ",
  "BOOKING_CREATE",
  "BOOKING_UPDATE",
  "DOC_REQUEST",
  "DOC_SUBMISSION_READ",
]);

export async function seedRolePermissions(db: DB) {
  const roles = await db.query.roles.findMany({
    where: (table, { inArray }) =>
      inArray(table.code, [
        superAdminRoleCode,
        adminRoleCode,
        agentRoleCode,
        customerRoleCode,
      ]),
  });

  const permissions = await db.query.permissions.findMany({
    where: (table, { eq: equal }) => equal(table.isActive, true),
  });

  const roleByCode = new Map(roles.map((role) => [role.code, role]));
  const permissionByCode = new Map(permissions.map((permission) => [permission.code, permission]));

  const superAdminRole = roleByCode.get(superAdminRoleCode);
  const adminRole = roleByCode.get(adminRoleCode);
  const agentRole = roleByCode.get(agentRoleCode);

  if (superAdminRole) {
    for (const permission of permissions) {
      await ensureActiveRolePermission(db, superAdminRole.id, permission.id);
    }
  }

  if (adminRole) {
    const adminPermissionCodes = permissions
      .filter(
        (permission) =>
          permission.moduleKey !== "GOVERNANCE" ||
          governanceReadPermissionCodes.has(permission.code),
      )
      .map((permission) => permission.code);

    for (const code of adminPermissionCodes) {
      const permission = permissionByCode.get(code);
      if (!permission) {
        continue;
      }

      await ensureActiveRolePermission(db, adminRole.id, permission.id);
    }
  }

  if (agentRole) {
    for (const code of agentPermissionCodes) {
      const permission = permissionByCode.get(code);
      if (!permission) {
        continue;
      }

      await ensureActiveRolePermission(db, agentRole.id, permission.id);
    }
  }
}

async function ensureActiveRolePermission(
  db: DB,
  roleId: string,
  permissionId: string,
) {
  const existing = await db.query.rolePermissions.findFirst({
    where: (table, { and: andCond, eq: equal, isNull: isNullCond }) =>
      andCond(
        equal(table.roleId, roleId),
        equal(table.permissionId, permissionId),
        isNullCond(table.revokedAt),
      ),
  });

  if (!existing) {
    await db.insert(schema.rolePermissions).values({
      roleId,
      permissionId,
      grantScope: "ALLOW",
      grantedAt: new Date(),
    });
    return;
  }

  if (existing.grantScope !== "ALLOW") {
    await db
      .update(schema.rolePermissions)
      .set({
        grantScope: "ALLOW",
      })
      .where(eq(schema.rolePermissions.id, existing.id));
  }

}