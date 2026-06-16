import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { roles, user } from "./identity-auth";

const idColumn = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID());

const createdAtColumn = () => timestamp("created_at").defaultNow().notNull();

const updatedAtColumn = () =>
  timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date());

export const permissionGroups = pgTable(
  "permission_groups",
  {
    id: idColumn(),
    code: varchar("code", { length: 50 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => ({
    codeUniq: unique().on(t.code),
    activeSortIdx: index("permission_groups_active_sort_idx").on(
      t.isActive,
      t.sortOrder,
    ),
  }),
);

export const permissions = pgTable(
  "permissions",
  {
    id: idColumn(),
    groupId: text("group_id")
      .references(() => permissionGroups.id)
      .notNull(),
    code: varchar("code", { length: 120 }).notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    description: text("description"),
    moduleKey: varchar("module_key", { length: 50 }).notNull(),
    actionKey: varchar("action_key", { length: 50 }).notNull(),
    resourceKey: varchar("resource_key", { length: 80 }).notNull(),
    riskLevel: varchar("risk_level", { length: 20 }).default("MEDIUM").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => ({
    codeUniq: unique().on(t.code),
    moduleActionActiveIdx: index("permissions_module_action_active_idx").on(
      t.moduleKey,
      t.actionKey,
      t.isActive,
    ),
    groupActiveIdx: index("permissions_group_active_idx").on(t.groupId, t.isActive),
  }),
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: idColumn(),
    roleId: text("role_id")
      .references(() => roles.id)
      .notNull(),
    permissionId: text("permission_id")
      .references(() => permissions.id)
      .notNull(),
    grantScope: varchar("grant_scope", { length: 20 }).default("ALLOW").notNull(),
    conditionJson: jsonb("condition_json"),
    grantedByUserId: text("granted_by_user_id").references(() => user.id),
    grantedAt: timestamp("granted_at").defaultNow().notNull(),
    revokedAt: timestamp("revoked_at"),
    revokedByUserId: text("revoked_by_user_id").references(() => user.id),
    reasonNote: text("reason_note"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (t) => ({
    activeRolePermissionUniq: uniqueIndex("role_permissions_active_role_permission_uniq")
      .on(t.roleId, t.permissionId)
      .where(sql`${t.revokedAt} is null`),
    roleRevokedIdx: index("role_permissions_role_revoked_idx").on(t.roleId, t.revokedAt),
    permissionRevokedIdx: index("role_permissions_permission_revoked_idx").on(
      t.permissionId,
      t.revokedAt,
    ),
  }),
);

export const userPermissions = pgTable(
  "user_permissions",
  {
    id: idColumn(),
    userId: text("user_id")
      .references(() => user.id)
      .notNull(),
    permissionId: text("permission_id")
      .references(() => permissions.id)
      .notNull(),
    overrideScope: varchar("override_scope", { length: 20 }).notNull(),
    isTemporary: boolean("is_temporary").default(false).notNull(),
    effectiveFrom: timestamp("effective_from"),
    effectiveTo: timestamp("effective_to"),
    grantedByUserId: text("granted_by_user_id").references(() => user.id),
    grantedAt: timestamp("granted_at").defaultNow().notNull(),
    revokedAt: timestamp("revoked_at"),
    revokedByUserId: text("revoked_by_user_id").references(() => user.id),
    reasonCode: varchar("reason_code", { length: 50 }),
    reasonNote: text("reason_note"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (t) => ({
    activeUserPermissionUniq: uniqueIndex("user_permissions_active_user_permission_uniq")
      .on(t.userId, t.permissionId)
      .where(sql`${t.revokedAt} is null`),
    userEffectiveIdx: index("user_permissions_user_effective_idx").on(
      t.userId,
      t.effectiveTo,
    ),
    permissionEffectiveIdx: index("user_permissions_permission_effective_idx").on(
      t.permissionId,
      t.effectiveTo,
    ),
  }),
);