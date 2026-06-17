"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  FileText,
  FolderKanban,
  Home,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  UserCog,
  UserRound,
  UsersRound,
  Warehouse,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";

import { AppStatusBadge } from "@/components/common/app-status-badge";
import { appToast } from "@/lib/app-toast";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

export type InternalShellIconKey =
  | "dashboard"
  | "users"
  | "agents"
  | "projects"
  | "properties"
  | "leads"
  | "bookings"
  | "customers"
  | "documents"
  | "appointments"
  | "reports"
  | "settings"
  | "profile";

export type InternalShellNavItem = {
  href: string;
  label: string;
  icon: InternalShellIconKey;
};

type InternalShellProps = {
  portal: "admin" | "agent";
  user: {
    name: string;
    email: string;
    roleCode?: string;
  };
  navItems: InternalShellNavItem[];
  children: ReactNode;
};

const iconMap = {
  dashboard: Home,
  users: UserCog,
  agents: BriefcaseBusiness,
  projects: FolderKanban,
  properties: Warehouse,
  leads: ClipboardList,
  bookings: FileText,
  customers: UsersRound,
  documents: FileText,
  appointments: CalendarCheck,
  reports: BarChart3,
  settings: Settings,
  profile: UserRound,
} satisfies Record<InternalShellIconKey, React.ComponentType<{ className?: string }>>;

function isNavActive(pathname: string, href: string) {
  if (href === "/admin" || href === "/agent") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function InternalShell({
  portal,
  user,
  navItems,
  children,
}: InternalShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const portalLabel = portal === "admin" ? "Admin Portal" : "Agent Portal";
  const portalHome = portal === "admin" ? "/admin" : "/agent";

  function handleLogout() {
    startTransition(async () => {
      try {
        await authClient.signOut();
        appToast.success("Logged out successfully.");
        router.push("/login");
        router.refresh();
      } catch {
        appToast.error("Unable to logout. Please try again.");
      }
    });
  }

  const sidebar = (
    <aside className="flex h-full w-[290px] flex-col border-r border-slate-200 bg-white">
      <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-6">
        <Link
          href={portalHome}
          className="grid size-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-sm"
        >
          <Building2 className="size-5" />
        </Link>

        <div className="min-w-0">
          <p className="truncate text-base font-black text-slate-950">
            PropertyGoJB
          </p>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
            {portalLabel}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
        {navItems.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = iconMap[item.icon];

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition",
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-700",
              )}
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-xl transition",
                  active
                    ? "bg-white/15 text-white"
                    : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700",
                )}
              >
                <Icon className="size-4" />
              </span>

              <span className="min-w-0 flex-1 truncate">{item.label}</span>

              {active ? <ChevronRight className="size-4" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-blue-100 text-sm font-black text-blue-700">
              {user.name.slice(0, 1).toUpperCase()}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-slate-950">
                {user.name}
              </p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <AppStatusBadge tone="info">
              {user.roleCode ?? "NO_ROLE"}
            </AppStatusBadge>

            <button
              type="button"
              disabled={isPending}
              onClick={handleLogout}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-white px-3 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        {sidebar}
      </div>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl lg:hidden">
        <Link href={portalHome} className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-blue-600 text-white">
            <Sparkles className="size-5" />
          </span>

          <div>
            <p className="text-sm font-black text-slate-950">PropertyGoJB</p>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
              {portalLabel}
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu overlay"
          />

          <div className="relative h-full w-[88vw] max-w-[320px] bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-600"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>

            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="lg:pl-[290px]">{children}</div>
    </div>
  );
}
