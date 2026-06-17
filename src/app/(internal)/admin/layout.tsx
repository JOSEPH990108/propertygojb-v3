import type { ReactNode } from "react";

import {
  InternalShell,
  type InternalShellNavItem,
} from "@/components/internal/shell/internal-shell";
import { requireRole } from "@/lib/auth/guards";

const adminNavItems: InternalShellNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/agents", label: "Agents", icon: "agents" },
  { href: "/admin/projects", label: "Projects", icon: "projects" },
  { href: "/admin/properties", label: "Properties", icon: "properties" },
  { href: "/admin/leads", label: "Leads", icon: "leads" },
  { href: "/admin/bookings", label: "Bookings", icon: "bookings" },
  { href: "/admin/customers", label: "Customers", icon: "customers" },
  { href: "/admin/appointments", label: "Appointments", icon: "appointments" },
  { href: "/admin/reports", label: "Reports", icon: "reports" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

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
    <InternalShell
      portal="admin"
      navItems={adminNavItems}
      user={{
        name: user.name ?? "Admin User",
        email: user.email ?? "-",
        roleCode: authContext.roleCode,
      }}
    >
      {children}
    </InternalShell>
  );
}
