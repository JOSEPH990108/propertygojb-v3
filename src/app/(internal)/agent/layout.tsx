import type { ReactNode } from "react";

import {
  InternalShell,
  type InternalShellNavItem,
} from "@/components/internal/shell/internal-shell";
import { requireRole } from "@/lib/auth/guards";

const agentNavItems: InternalShellNavItem[] = [
  { href: "/agent", label: "Dashboard", icon: "dashboard" },
  { href: "/agent/leads", label: "Leads", icon: "leads" },
  { href: "/agent/bookings", label: "Bookings", icon: "bookings" },
  { href: "/agent/customers", label: "Customers", icon: "customers" },
  { href: "/agent/follow-ups", label: "Follow-Ups", icon: "followUps" },
  { href: "/agent/documents", label: "Documents", icon: "documents" },
  { href: "/agent/appointments", label: "Appointments", icon: "appointments" },
  { href: "/agent/profile", label: "Profile", icon: "profile" },
];

export default async function AgentLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  // TEMP: Allow SUPER_ADMIN during development for easier portal checking.
  // TODO: Before production release, change back to ["AGENT"] if required.
  const authContext = await requireRole(["AGENT", "SUPER_ADMIN"], "/agent");
  const user = authContext.user as {
    name?: string | null;
    email?: string | null;
  };

  return (
    <InternalShell
      portal="agent"
      navItems={agentNavItems}
      user={{
        name: user.name ?? "Agent User",
        email: user.email ?? "-",
        roleCode: authContext.roleCode,
      }}
    >
      {children}
    </InternalShell>
  );
}
