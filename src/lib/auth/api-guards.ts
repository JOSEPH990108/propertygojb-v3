import "server-only";

import {
  type AuthContext,
  type GuardRoleCode,
  getCurrentAuthContext,
} from "./guards";

export type ApiRoleResult =
  | { ok: true; authContext: AuthContext }
  | { ok: false; status: 401 | 403; message: string };

export async function authorizeApiRoles(
  allowedRoles: readonly GuardRoleCode[],
): Promise<ApiRoleResult> {
  const authContext = await getCurrentAuthContext();

  if (!authContext.isAuthenticated) {
    return { ok: false, status: 401, message: "Authentication is required." };
  }

  if (!authContext.roleCode || !allowedRoles.includes(authContext.roleCode)) {
    return { ok: false, status: 403, message: "You are not authorized to perform this action." };
  }

  return { ok: true, authContext };
}