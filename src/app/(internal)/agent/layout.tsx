import type { ReactNode } from "react";

import { InternalTopbar } from "@/components/internal/shell/internal-topbar";
import { requireRole } from "@/lib/auth/guards";

export default async function AgentLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const allowedRoles: Parameters<typeof requireRole>[0] =
    process.env.NODE_ENV === "development"
      ? ["AGENT", "SUPER_ADMIN"]
      : ["AGENT"];

  const authContext = await requireRole(allowedRoles, "/agent");
  const user = authContext.user as {
    name?: string | null;
    email?: string | null;
  };

  return (
    <main className="min-h-screen px-6 py-10">
      <InternalTopbar
        portal="Agent"
        userName={user.name}
        userEmail={user.email}
        roleCode={authContext.roleCode}
      />

      {children}
    </main>
  );
}
