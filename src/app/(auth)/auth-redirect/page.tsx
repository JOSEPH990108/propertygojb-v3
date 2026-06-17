import { redirect } from "next/navigation";

import {
  getCurrentAuthContext,
  getRoleHomePath,
} from "@/lib/auth/guards";

export default async function AuthRedirectPage() {
  const authContext = await getCurrentAuthContext();

  if (!authContext.isAuthenticated) {
    redirect("/login");
  }

  redirect(getRoleHomePath(authContext.roleCode));
}
