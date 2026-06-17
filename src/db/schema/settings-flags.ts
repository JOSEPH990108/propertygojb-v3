import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
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

export const systemSettings = pgTable(
  "system_settings",
  {
    id: idColumn(),
    key: varchar("key", { length: 120 }).notNull(),
    valueJson: jsonb("value_json").notNull(),
    valueType: varchar("value_type", { length: 20 }).notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    environment: varchar("environment", { length: 20 }).notNull(),
    // Store only secret references (for example vault paths), never raw secret values.
    isSecret: boolean("is_secret").default(false).notNull(),
    isReadOnly: boolean("is_read_only").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    updatedByUserId: text("updated_by_user_id").references(() => user.id),
    changeReason: text("change_reason"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => ({
    activeKeyEnvUniq: uniqueIndex("system_settings_active_key_env_uniq")
      .on(t.key, t.environment)
      .where(sql`${t.deletedAt} is null`),
    categoryEnvActiveIdx: index("system_settings_category_env_active_idx").on(
      t.category,
      t.environment,
      t.isActive,
    ),
  }),
);

export const featureFlags = pgTable(
  "feature_flags",
  {
    id: idColumn(),
    key: varchar("key", { length: 120 }).notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 50 }),
    isEnabled: boolean("is_enabled").default(false).notNull(),
    environment: varchar("environment", { length: 20 }).notNull(),
    rolloutMode: varchar("rollout_mode", { length: 30 }).default("GLOBAL").notNull(),
    rolloutPercentage: integer("rollout_percentage"),
    prerequisitesJson: jsonb("prerequisites_json"),
    sunsetAt: timestamp("sunset_at"),
    updatedByUserId: text("updated_by_user_id").references(() => user.id),
    changeReason: text("change_reason"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => ({
    activeKeyEnvUniq: uniqueIndex("feature_flags_active_key_env_uniq")
      .on(t.key, t.environment)
      .where(sql`${t.deletedAt} is null`),
    envEnabledIdx: index("feature_flags_env_enabled_idx").on(
      t.environment,
      t.isEnabled,
    ),
    categoryEnvIdx: index("feature_flags_category_env_idx").on(
      t.category,
      t.environment,
    ),
  }),
);

export const featureFlagOverrides = pgTable(
  "feature_flag_overrides",
  {
    id: idColumn(),
    featureFlagId: text("feature_flag_id")
      .references(() => featureFlags.id)
      .notNull(),
    roleId: text("role_id").references(() => roles.id),
    userId: text("user_id").references(() => user.id),
    overrideEnabled: boolean("override_enabled").notNull(),
    effectiveFrom: timestamp("effective_from"),
    effectiveTo: timestamp("effective_to"),
    updatedByUserId: text("updated_by_user_id").references(() => user.id),
    reasonNote: text("reason_note"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (t) => ({
    activeRoleOverrideUniq: uniqueIndex("feature_flag_overrides_active_role_uniq")
      .on(t.featureFlagId, t.roleId)
      .where(sql`${t.roleId} is not null and ${t.effectiveTo} is null`),
    activeUserOverrideUniq: uniqueIndex("feature_flag_overrides_active_user_uniq")
      .on(t.featureFlagId, t.userId)
      .where(sql`${t.userId} is not null and ${t.effectiveTo} is null`),
    flagEffectiveToIdx: index("feature_flag_overrides_flag_effective_to_idx").on(
      t.featureFlagId,
      t.effectiveTo,
    ),
    roleUserXorCheck: check(
      "feature_flag_overrides_role_user_xor_check",
      sql`(${t.roleId} is not null and ${t.userId} is null) or (${t.roleId} is null and ${t.userId} is not null)`,
    ),
  }),
);