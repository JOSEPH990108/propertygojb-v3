import type { ReactNode } from "react";

import { InternalTopbar } from "@/components/internal/shell/internal-topbar";
import { requireRole } from "@/lib/auth/guards";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const authContext = await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin");
  const user = authContext.user as {
    name?: string | null;
    email?: string | null;
  };

  return (
    <main className="min-h-screen px-6 py-10">
      <InternalTopbar
        portal="Admin"
        userName={user.name}
        userEmail={user.email}
        roleCode={authContext.roleCode}
      />

      {children}
    </main>
  );
}
