import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import {
  getCurrentAuthContext,
  getRoleHomePath,
} from "@/lib/auth/guards";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const authContext = await getCurrentAuthContext();

  if (authContext.isAuthenticated) {
    redirect(getRoleHomePath(authContext.roleCode));
  }

  return children;
}
