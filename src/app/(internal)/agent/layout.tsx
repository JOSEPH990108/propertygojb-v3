import type { ReactNode } from "react";

import { InternalTopbar } from "@/components/internal/shell/internal-topbar";
import { requireRole } from "@/lib/auth/guards";

export default async function AgentLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  // TEMP: Allow SUPER_ADMIN during development for easier portal checking.
  // TODO: Before production release, change back to ["AGENT"] only if needed.
  const authContext = await requireRole(["AGENT", "SUPER_ADMIN"], "/agent");
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
