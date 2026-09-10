import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";

type DB = PostgresJsDatabase<typeof schema>;

const systemSettingsBaseline = [
  {
    key: "RBAC_RESOLUTION_ORDER",
    environment: "ALL",
    category: "GOVERNANCE",
    valueType: "JSON",
    valueJson: {
      order: [
        "USER_DENY",
        "ROLE_DENY",
        "USER_ALLOW",
        "ROLE_ALLOW",
        "IMPLICIT_DENY",
      ],
      denyOutranksAllow: true,
    },
    changeReason: "Phase 1D governance baseline.",
    isSecret: false,
    isReadOnly: true,
    isActive: true,
  },
  {
    key: "APPROVAL_REQUIRED_ACTIONS",
    environment: "PRODUCTION",
    category: "GOVERNANCE",
    valueType: "JSON",
    valueJson: {
      actions: [
        "USER_PERMISSION_OVERRIDE",
        "ROLE_PERMISSION_MANAGE",
        "SYSTEM_SETTING_UPDATE",
        "FEATURE_FLAG_UPDATE_GLOBAL",
      ],
    },
    changeReason: "Phase 1D governance baseline.",
    isSecret: false,
    isReadOnly: false,
    isActive: true,
  },
  {
    key: "booking.reservation_expiry_days",
    environment: "ALL",
    category: "BOOKING",
    valueType: "NUMBER",
    valueJson: 3,
    changeReason: "Default booking deposit lock period.",
    isSecret: false,
    isReadOnly: false,
    isActive: true,
  },
  {
    key: "booking.lo_sign_expiry_days",
    environment: "ALL",
    category: "BOOKING",
    valueType: "NUMBER",
    valueJson: 14,
    changeReason: "Default LO signing period after LO is obtained.",
    isSecret: false,
    isReadOnly: false,
    isActive: true,
  },
] as const;

const featureFlagsBaseline = [
  {
    key: "governance.approval.guard",
    environment: "ALL",
    category: "GOVERNANCE",
    name: "Governance Approval Guard",
    description: "Enforce two-step approval checks for high-risk governance actions.",
    isEnabled: true,
    rolloutMode: "GLOBAL",
    rolloutPercentage: null,
    prerequisitesJson: null,
    changeReason: "Phase 1D governance baseline.",
  },
  {
    key: "governance.audit.capture",
    environment: "ALL",
    category: "GOVERNANCE",
    name: "Governance Audit Capture",
    description: "Enable centralized audit capture for sensitive governance actions.",
    isEnabled: true,
    rolloutMode: "GLOBAL",
    rolloutPercentage: null,
    prerequisitesJson: null,
    changeReason: "Phase 1D governance baseline.",
  },
] as const;

export async function seedSettingsAndFlags(db: DB) {
  for (const setting of systemSettingsBaseline) {
    const existing = await db.query.systemSettings.findFirst({
      where: (table, { and: andCond, eq: equal, isNull: isNullCond }) =>
        andCond(
          equal(table.key, setting.key),
          equal(table.environment, setting.environment),
          isNullCond(table.deletedAt),
        ),
    });

    if (!existing) {
      await db.insert(schema.systemSettings).values(setting);
      continue;
    }

    await db
      .update(schema.systemSettings)
      .set({
        valueJson: setting.valueJson,
        valueType: setting.valueType,
        category: setting.category,
        isSecret: setting.isSecret,
        isReadOnly: setting.isReadOnly,
        isActive: setting.isActive,
        changeReason: setting.changeReason,
        deletedAt: null,
      })
      .where(eq(schema.systemSettings.id, existing.id));
  }

  for (const flag of featureFlagsBaseline) {
    const existing = await db.query.featureFlags.findFirst({
      where: (table, { and: andCond, eq: equal, isNull: isNullCond }) =>
        andCond(
          equal(table.key, flag.key),
          equal(table.environment, flag.environment),
          isNullCond(table.deletedAt),
        ),
    });

    if (!existing) {
      await db.insert(schema.featureFlags).values(flag);
      continue;
    }

    await db
      .update(schema.featureFlags)
      .set({
        name: flag.name,
        description: flag.description,
        category: flag.category,
        isEnabled: flag.isEnabled,
        rolloutMode: flag.rolloutMode,
        rolloutPercentage: flag.rolloutPercentage,
        prerequisitesJson: flag.prerequisitesJson,
        changeReason: flag.changeReason,
        deletedAt: null,
      })
      .where(eq(schema.featureFlags.id, existing.id));
  }
}