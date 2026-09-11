import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { InlineScript } from "@/components/common/inline-script";
import { PublicThemeScope } from "@/components/public/public-theme-scope";
import { getCurrentAuthContext, getRoleHomePath } from "@/lib/auth/guards";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const authContext = await getCurrentAuthContext();

  if (authContext.isAuthenticated) {
    redirect(getRoleHomePath(authContext.roleCode));
  }

  return (
    <>
      {/* Same editorial ivory/charcoal scope as the public site (see globals.css). */}
      <InlineScript html="document.body.setAttribute('data-ui','public')" />
      <PublicThemeScope />
      {children}
    </>
  );
}
