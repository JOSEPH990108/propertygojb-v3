import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";

type DB = PostgresJsDatabase<typeof schema>;

const SAMPLE_APPROVAL_DEDUPE_KEY = "phase1d-sample-approval-system-setting-update";

export async function seedGovernanceSampleOptional(db: DB) {
  if (process.env.APP_ENV !== "development") {
    return;
  }

  if (process.env.ENABLE_PHASE1D_GOVERNANCE_SAMPLE !== "true") {
    return;
  }

  const [adminRole, superAdminRole] = await Promise.all([
    db.query.roles.findFirst({
      where: (table, { eq: equal }) => equal(table.code, "ADMIN"),
    }),
    db.query.roles.findFirst({
      where: (table, { eq: equal }) => equal(table.code, "SUPER_ADMIN"),
    }),
  ]);

  const [approvalGuardFlag, featureFlagReadPermission] = await Promise.all([
    db.query.featureFlags.findFirst({
      where: (table, { and: andCond, eq: equal, isNull: isNullCond }) =>
        andCond(
          equal(table.key, "governance.approval.guard"),
          equal(table.environment, "ALL"),
          isNullCond(table.deletedAt),
        ),
    }),
    db.query.permissions.findFirst({
      where: (table, { eq: equal }) => equal(table.code, "FEATURE_FLAG_READ"),
    }),
  ]);

  if (adminRole && approvalGuardFlag) {
    const existingAdminOverride = await db.query.featureFlagOverrides.findFirst({
      where: (table, { and: andCond, eq: equal, isNull: isNullCond }) =>
        andCond(
          equal(table.featureFlagId, approvalGuardFlag.id),
          equal(table.roleId, adminRole.id),
          isNullCond(table.effectiveTo),
        ),
    });

    if (!existingAdminOverride) {
      await db.insert(schema.featureFlagOverrides).values({
        featureFlagId: approvalGuardFlag.id,
        roleId: adminRole.id,
        overrideEnabled: true,
        reasonNote: "Phase 1D optional development sample override.",
      });
    }
  }

  if (superAdminRole && featureFlagReadPermission) {
    const existingSuperAdminGrant = await db.query.rolePermissions.findFirst({
      where: (table, { and: andCond, eq: equal, isNull: isNullCond }) =>
        andCond(
          equal(table.roleId, superAdminRole.id),
          equal(table.permissionId, featureFlagReadPermission.id),
          isNullCond(table.revokedAt),
        ),
    });

    if (!existingSuperAdminGrant) {
      await db.insert(schema.rolePermissions).values({
        roleId: superAdminRole.id,
        permissionId: featureFlagReadPermission.id,
        grantScope: "ALLOW",
        reasonNote: "Phase 1D optional development sample grant.",
      });
    }
  }

  if (!superAdminRole) {
    return;
  }

  const requester = await db.query.user.findFirst({
    where: (table, { eq: equal }) => equal(table.roleId, superAdminRole.id),
  });

  if (!requester) {
    return;
  }

  const existingPendingApproval = await db.query.adminActionApprovals.findFirst({
    where: (table, { and: andCond, eq: equal }) =>
      andCond(
        equal(table.dedupeKey, SAMPLE_APPROVAL_DEDUPE_KEY),
        equal(table.status, "PENDING"),
      ),
  });

  if (!existingPendingApproval) {
    await db.insert(schema.adminActionApprovals).values({
      actionType: "SYSTEM_SETTING_UPDATE",
      targetEntityType: "SYSTEM_SETTING",
      requestedByUserId: requester.id,
      status: "PENDING",
      dedupeKey: SAMPLE_APPROVAL_DEDUPE_KEY,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      requestReason: "Phase 1D optional development sample approval request.",
      payloadJson: {
        settingKey: "APPROVAL_REQUIRED_ACTIONS",
        environment: "PRODUCTION",
      },
    });
  }

  const approvalRecord =
    existingPendingApproval ??
    (await db.query.adminActionApprovals.findFirst({
      where: (table, { and: andCond, eq: equal }) =>
        andCond(
          equal(table.dedupeKey, SAMPLE_APPROVAL_DEDUPE_KEY),
          equal(table.status, "PENDING"),
        ),
    }));

  const existingAuditSampleLog = await db.query.auditLogs.findFirst({
    where: (table, { and: andCond, eq: equal }) =>
      andCond(
        equal(table.actorUserId, requester.id),
        equal(table.entityType, "ADMIN_ACTION_APPROVAL"),
        equal(
          table.changeSummary,
          "Phase 1D optional development sample approval checked/created.",
        ),
      ),
  });

  if (!existingAuditSampleLog) {
    await db.insert(schema.auditLogs).values({
      actorUserId: requester.id,
      actorRoleId: requester.roleId,
      actionType: "CREATE",
      entityType: "ADMIN_ACTION_APPROVAL",
      entityId: approvalRecord?.id,
      sourceApp: "ADMIN_PORTAL",
      changeSummary: "Phase 1D optional development sample approval checked/created.",
      metadata: {
        seeded: true,
      },
    });
  }

  const existingAuthSampleLog = await db.query.authAuditLogs.findFirst({
    where: (table, { and: andCond, eq: equal }) =>
      andCond(
        equal(table.userId, requester.id),
        equal(table.eventType, "LOGIN_SUCCESS"),
        equal(table.sourceApp, "ADMIN_PORTAL"),
      ),
  });

  if (!existingAuthSampleLog) {
    await db.insert(schema.authAuditLogs).values({
      userId: requester.id,
      eventType: "LOGIN_SUCCESS",
      eventStatus: "SUCCESS",
      riskLevel: "LOW",
      sourceApp: "ADMIN_PORTAL",
      metadata: {
        seeded: true,
        purpose: "phase1d_governance_optional_sample",
      },
    });
  }
}