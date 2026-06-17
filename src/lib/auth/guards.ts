import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { db } from "@/db";
import { auth } from "@/lib/auth/server";

export type GuardRoleCode = "CUSTOMER" | "AGENT" | "ADMIN" | "SUPER_ADMIN";

export type AuthContext = {
  session: unknown;
  user: unknown;
  roleCode?: GuardRoleCode;
  roleId?: string;
  isAuthenticated: boolean;
};

function normalizeRoleCode(value: unknown): GuardRoleCode | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();

  switch (normalized) {
    case "CUSTOMER":
    case "AGENT":
    case "ADMIN":
    case "SUPER_ADMIN":
      return normalized;
    default:
      return undefined;
  }
}

export function getRoleHomePath(roleCode?: GuardRoleCode): string {
  switch (roleCode) {
    case "ADMIN":
    case "SUPER_ADMIN":
      return routes.admin.dashboard;
    case "AGENT":
      return routes.agent.dashboard;
    case "CUSTOMER":
    default:
      return routes.public.home;
  }
}

export function getLoginRedirectPath(nextPath?: string): string {
  if (!nextPath) {
    return routes.auth.login;
  }

  const normalizedPath = nextPath.trim();
  const lower = normalizedPath.toLowerCase();

  if (
    !normalizedPath.startsWith("/") ||
    normalizedPath.startsWith("//") ||
    /^[a-z][a-z\d+\-.]*:/.test(lower)
  ) {
    return routes.auth.login;
  }

  return `${routes.auth.login}?next=${encodeURIComponent(normalizedPath)}`;
}

export async function resolveUserRoleFromDb(userId: unknown) {
  if (typeof userId !== "string" || !userId) {
    return {};
  }

  const userRecord = await db.query.user.findFirst({
    where: (table, { eq }) => eq(table.id, userId),
    columns: {
      roleId: true,
    },
  });

  const roleId = userRecord?.roleId;

  if (!roleId) {
    return {};
  }

  const roleRecord = await db.query.roles.findFirst({
    where: (table, { eq }) => eq(table.id, roleId),
    columns: {
      id: true,
      code: true,
    },
  });

  const roleCode = normalizeRoleCode(roleRecord?.code);

  return {
    roleCode,
    roleId: roleRecord?.id,
  };
}

export async function getCurrentAuthContext(): Promise<AuthContext> {
  const requestHeaders = await headers();

  const sessionResult = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!sessionResult?.session || !sessionResult.user) {
    return {
      session: null,
      user: null,
      isAuthenticated: false,
    };
  }

  const sessionUser = sessionResult.user as { id?: unknown };
  const resolvedRole = await resolveUserRoleFromDb(sessionUser.id);

  return {
    session: sessionResult.session,
    user: sessionResult.user,
    roleCode: resolvedRole.roleCode,
    roleId: resolvedRole.roleId,
    isAuthenticated: true,
  };
}

export async function requireRole(
  allowedRoles: readonly GuardRoleCode[],
  nextPath?: string,
) {
  const authContext = await getCurrentAuthContext();

  if (!authContext.isAuthenticated) {
    redirect(getLoginRedirectPath(nextPath));
  }

  if (!authContext.roleCode) {
    redirect(routes.public.home);
  }

  if (!allowedRoles.includes(authContext.roleCode)) {
    redirect(getRoleHomePath(authContext.roleCode));
  }

  return authContext;
}
