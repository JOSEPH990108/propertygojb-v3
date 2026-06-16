import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/guards";

export default async function AgentLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await requireRole(["AGENT"], "/agent");

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mb-6 border-b pb-4">
        <p className="text-sm text-muted-foreground">Agent Portal</p>
      </div>
      {children}
    </main>
  );
}
