import "server-only";

import type { NextRequest } from "next/server";

import { db, schema } from "@/db";

type AuditEvent = {
  actionType: string;
  entityType: string;
  entityId?: string | null;
  actorUserId?: string | null;
  actorRoleId?: string | null;
  sourceApp: "PUBLIC_WEBSITE" | "CUSTOMER_PORTAL" | "AGENT_PORTAL" | "ADMIN_PORTAL" | "SYSTEM";
  changeSummary: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  metadata?: Record<string, unknown>;
  request?: NextRequest;
};

function getClientIp(request?: NextRequest) {
  if (!request) {
    return null;
  }

  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
}

/**
 * Records meaningful business mutations. High-volume page views belong in the
 * consented analytics layer, not the immutable operational audit trail.
 */
export async function writeAuditLog(event: AuditEvent) {
  await db.insert(schema.auditLogs).values({
    actorUserId: event.actorUserId ?? null,
    actorRoleId: event.actorRoleId ?? null,
    actionType: event.actionType.slice(0, 40),
    entityType: event.entityType.slice(0, 60),
    entityId: event.entityId ?? null,
    sourceApp: event.sourceApp,
    beforeJson: event.beforeJson,
    afterJson: event.afterJson,
    changeSummary: event.changeSummary,
    ipAddress: getClientIp(event.request),
    userAgent: event.request?.headers.get("user-agent") ?? null,
    metadata: event.metadata,
  });
}
