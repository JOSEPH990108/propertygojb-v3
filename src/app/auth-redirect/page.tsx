import { redirect } from "next/navigation";

import {
  type GuardRoleCode,
  getCurrentAuthContext,
  getRoleHomePath,
} from "@/lib/auth/guards";

function getAllowedDestination(roleCode: GuardRoleCode | undefined, nextPath?: string) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return null;
  }

  if (roleCode === "CUSTOMER" && (nextPath === "/account" || nextPath.startsWith("/account/"))) {
    return nextPath;
  }

  if (roleCode === "AGENT" && (nextPath === "/agent" || nextPath.startsWith("/agent/"))) {
    return nextPath;
  }

  if (
    (roleCode === "ADMIN" || roleCode === "SUPER_ADMIN") &&
    (nextPath === "/admin" || nextPath.startsWith("/admin/"))
  ) {
    return nextPath;
  }

  return null;
}

export default async function AuthRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const authContext = await getCurrentAuthContext();

  if (!authContext.isAuthenticated) {
    redirect("/login");
  }

  const requestedPath = (await searchParams).next;
  const allowedDestination = getAllowedDestination(
    authContext.roleCode,
    requestedPath,
  );

  redirect(allowedDestination ?? getRoleHomePath(authContext.roleCode));
}