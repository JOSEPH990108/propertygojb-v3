import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";

type DB = PostgresJsDatabase<typeof schema>;

type PermissionSeed = {
  code: string;
  name: string;
  description: string;
  groupCode: "CATALOG" | "LEADS" | "BOOKINGS" | "DOCUMENTS" | "GOVERNANCE";
  moduleKey: "CATALOG" | "LEADS" | "BOOKINGS" | "DOCUMENTS" | "GOVERNANCE";
  actionKey:
    | "READ"
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "APPROVE"
    | "REJECT"
    | "VERIFY"
    | "ASSIGN"
    | "EXPORT"
    | "MANAGE"
    | "OVERRIDE"
    | "DOWNLOAD";
  resourceKey:
    | "PROJECT"
    | "UNIT"
    | "LEAD"
    | "LEAD_ACTIVITY"
    | "BOOKING"
    | "BOOKING_PAYMENT"
    | "DOCUMENT"
    | "USER"
    | "ROLE_PERMISSION"
    | "USER_PERMISSION"
    | "FEATURE_FLAG"
    | "SYSTEM_SETTING"
    | "AUDIT";
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

const permissionsBaseline: PermissionSeed[] = [
  { code: "PROJECT_READ", name: "Project Read", description: "View project catalog data.", groupCode: "CATALOG", moduleKey: "CATALOG", actionKey: "READ", resourceKey: "PROJECT", riskLevel: "LOW" },
  { code: "PROJECT_CREATE", name: "Project Create", description: "Create new projects.", groupCode: "CATALOG", moduleKey: "CATALOG", actionKey: "CREATE", resourceKey: "PROJECT", riskLevel: "HIGH" },
  { code: "PROJECT_UPDATE", name: "Project Update", description: "Update project records.", groupCode: "CATALOG", moduleKey: "CATALOG", actionKey: "UPDATE", resourceKey: "PROJECT", riskLevel: "HIGH" },
  { code: "PROJECT_PUBLISH", name: "Project Publish", description: "Publish projects for public visibility.", groupCode: "CATALOG", moduleKey: "CATALOG", actionKey: "APPROVE", resourceKey: "PROJECT", riskLevel: "HIGH" },
  { code: "UNIT_READ", name: "Unit Read", description: "View unit availability and pricing.", groupCode: "CATALOG", moduleKey: "CATALOG", actionKey: "READ", resourceKey: "UNIT", riskLevel: "LOW" },
  { code: "UNIT_UPDATE", name: "Unit Update", description: "Update unit inventory and reservation data.", groupCode: "CATALOG", moduleKey: "CATALOG", actionKey: "UPDATE", resourceKey: "UNIT", riskLevel: "HIGH" },

  { code: "LEAD_READ", name: "Lead Read", description: "View lead profiles and activity.", groupCode: "LEADS", moduleKey: "LEADS", actionKey: "READ", resourceKey: "LEAD", riskLevel: "MEDIUM" },
  { code: "LEAD_ASSIGN", name: "Lead Assign", description: "Assign leads to queues or agents.", groupCode: "LEADS", moduleKey: "LEADS", actionKey: "ASSIGN", resourceKey: "LEAD", riskLevel: "HIGH" },
  { code: "LEAD_UPDATE_STATUS", name: "Lead Update Status", description: "Update lead lifecycle status.", groupCode: "LEADS", moduleKey: "LEADS", actionKey: "UPDATE", resourceKey: "LEAD", riskLevel: "MEDIUM" },
  { code: "LEAD_ACTIVITY_CREATE", name: "Lead Activity Create", description: "Create timeline activities on leads.", groupCode: "LEADS", moduleKey: "LEADS", actionKey: "CREATE", resourceKey: "LEAD_ACTIVITY", riskLevel: "LOW" },

  { code: "BOOKING_READ", name: "Booking Read", description: "View booking transactions.", groupCode: "BOOKINGS", moduleKey: "BOOKINGS", actionKey: "READ", resourceKey: "BOOKING", riskLevel: "MEDIUM" },
  { code: "BOOKING_CREATE", name: "Booking Create", description: "Create booking transactions.", groupCode: "BOOKINGS", moduleKey: "BOOKINGS", actionKey: "CREATE", resourceKey: "BOOKING", riskLevel: "HIGH" },
  { code: "BOOKING_UPDATE", name: "Booking Update", description: "Update booking transactional details.", groupCode: "BOOKINGS", moduleKey: "BOOKINGS", actionKey: "UPDATE", resourceKey: "BOOKING", riskLevel: "HIGH" },
  { code: "BOOKING_APPROVE", name: "Booking Approve", description: "Approve booking transactions.", groupCode: "BOOKINGS", moduleKey: "BOOKINGS", actionKey: "APPROVE", resourceKey: "BOOKING", riskLevel: "CRITICAL" },
  { code: "BOOKING_REJECT", name: "Booking Reject", description: "Reject booking transactions.", groupCode: "BOOKINGS", moduleKey: "BOOKINGS", actionKey: "REJECT", resourceKey: "BOOKING", riskLevel: "HIGH" },
  { code: "BOOKING_PAYMENT_VERIFY", name: "Booking Payment Verify", description: "Verify booking payment proof and status.", groupCode: "BOOKINGS", moduleKey: "BOOKINGS", actionKey: "VERIFY", resourceKey: "BOOKING_PAYMENT", riskLevel: "CRITICAL" },

  { code: "DOC_REQUEST", name: "Document Request", description: "Request required booking documents.", groupCode: "DOCUMENTS", moduleKey: "DOCUMENTS", actionKey: "CREATE", resourceKey: "DOCUMENT", riskLevel: "MEDIUM" },
  { code: "DOC_SUBMISSION_READ", name: "Document Submission Read", description: "View submitted booking documents.", groupCode: "DOCUMENTS", moduleKey: "DOCUMENTS", actionKey: "READ", resourceKey: "DOCUMENT", riskLevel: "HIGH" },
  { code: "DOC_VERIFY", name: "Document Verify", description: "Verify or reject submitted documents.", groupCode: "DOCUMENTS", moduleKey: "DOCUMENTS", actionKey: "VERIFY", resourceKey: "DOCUMENT", riskLevel: "CRITICAL" },
  { code: "DOC_VIEW_SENSITIVE", name: "Document View Sensitive", description: "Access sensitive document contents.", groupCode: "DOCUMENTS", moduleKey: "DOCUMENTS", actionKey: "READ", resourceKey: "DOCUMENT", riskLevel: "CRITICAL" },
  { code: "DOC_DOWNLOAD", name: "Document Download", description: "Download stored booking documents.", groupCode: "DOCUMENTS", moduleKey: "DOCUMENTS", actionKey: "DOWNLOAD", resourceKey: "DOCUMENT", riskLevel: "HIGH" },

  { code: "USER_READ", name: "User Read", description: "View user and identity profile records.", groupCode: "GOVERNANCE", moduleKey: "GOVERNANCE", actionKey: "READ", resourceKey: "USER", riskLevel: "MEDIUM" },
  { code: "USER_UPDATE", name: "User Update", description: "Update user profile and role metadata.", groupCode: "GOVERNANCE", moduleKey: "GOVERNANCE", actionKey: "UPDATE", resourceKey: "USER", riskLevel: "HIGH" },
  { code: "ROLE_PERMISSION_MANAGE", name: "Role Permission Manage", description: "Manage role-level RBAC grants and denies.", groupCode: "GOVERNANCE", moduleKey: "GOVERNANCE", actionKey: "MANAGE", resourceKey: "ROLE_PERMISSION", riskLevel: "CRITICAL" },
  { code: "USER_PERMISSION_OVERRIDE", name: "User Permission Override", description: "Apply user-level permission overrides.", groupCode: "GOVERNANCE", moduleKey: "GOVERNANCE", actionKey: "OVERRIDE", resourceKey: "USER_PERMISSION", riskLevel: "CRITICAL" },
  { code: "FEATURE_FLAG_READ", name: "Feature Flag Read", description: "View feature flag definitions and rollout state.", groupCode: "GOVERNANCE", moduleKey: "GOVERNANCE", actionKey: "READ", resourceKey: "FEATURE_FLAG", riskLevel: "MEDIUM" },
  { code: "FEATURE_FLAG_UPDATE", name: "Feature Flag Update", description: "Change feature flag values and rollout mode.", groupCode: "GOVERNANCE", moduleKey: "GOVERNANCE", actionKey: "UPDATE", resourceKey: "FEATURE_FLAG", riskLevel: "CRITICAL" },
  { code: "SYSTEM_SETTING_READ", name: "System Setting Read", description: "Read runtime system settings.", groupCode: "GOVERNANCE", moduleKey: "GOVERNANCE", actionKey: "READ", resourceKey: "SYSTEM_SETTING", riskLevel: "MEDIUM" },
  { code: "SYSTEM_SETTING_UPDATE", name: "System Setting Update", description: "Update runtime system settings.", groupCode: "GOVERNANCE", moduleKey: "GOVERNANCE", actionKey: "UPDATE", resourceKey: "SYSTEM_SETTING", riskLevel: "CRITICAL" },
  { code: "AUDIT_READ", name: "Audit Read", description: "Read operational and security audit logs.", groupCode: "GOVERNANCE", moduleKey: "GOVERNANCE", actionKey: "READ", resourceKey: "AUDIT", riskLevel: "HIGH" },
];

export async function seedPermissions(db: DB) {
  const groups = await db.query.permissionGroups.findMany();
  const groupByCode = new Map(groups.map((group) => [group.code, group.id]));

  for (const permission of permissionsBaseline) {
    const groupId = groupByCode.get(permission.groupCode);

    if (!groupId) {
      continue;
    }

    await db
      .insert(schema.permissions)
      .values({
        groupId,
        code: permission.code,
        name: permission.name,
        description: permission.description,
        moduleKey: permission.moduleKey,
        actionKey: permission.actionKey,
        resourceKey: permission.resourceKey,
        riskLevel: permission.riskLevel,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: schema.permissions.code,
        set: {
          groupId,
          name: permission.name,
          description: permission.description,
          moduleKey: permission.moduleKey,
          actionKey: permission.actionKey,
          resourceKey: permission.resourceKey,
          riskLevel: permission.riskLevel,
          isActive: true,
          deletedAt: null,
        },
      });
  }
}