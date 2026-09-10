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
  UploadCloud,
  CalendarClock,
} from "lucide-react";
import { useRef, useState, useTransition } from "react";

import { AppSkipLink } from "@/components/common/app-skip-link";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { appToast } from "@/lib/app-toast";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

export type InternalShellIconKey =
  | "dashboard"
  | "imports"
  | "users"
  | "agents"
  | "projects"
  | "properties"
  | "leads"
  | "bookings"
  | "customers"
  | "documents"
  | "followUps"
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
  imports: UploadCloud,
  dashboard: Home,
  users: UserCog,
  agents: BriefcaseBusiness,
  projects: FolderKanban,
  properties: Warehouse,
  leads: ClipboardList,
  bookings: FileText,
  customers: UsersRound,
  documents: FileText,
  followUps: CalendarClock,
  appointments: CalendarCheck,
  reports: BarChart3,
  settings: Settings,
  profile: UserRound,
} satisfies Record<
  InternalShellIconKey,
  React.ComponentType<{ className?: string }>
>;

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
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);

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

  const sidebarNav = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
      {navItems.map((item) => {
        const active = isNavActive(pathname, item.href);
        const Icon = iconMap[item.icon];

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition",
              active
                ? "bg-brand text-brand-foreground shadow-sm"
                : "text-muted-foreground hover:bg-brand-subtle hover:text-brand-subtle-foreground",
            )}
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-xl transition",
                active
                  ? "bg-brand-foreground/15 text-brand-foreground"
                  : "bg-muted text-muted-foreground group-hover:bg-brand-subtle group-hover:text-brand-subtle-foreground",
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
  );

  const sidebarFooter = (
    <div className="border-t border-border p-4">
      <div className="rounded-[1.5rem] border border-border bg-muted p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-brand-subtle text-sm font-black text-brand-subtle-foreground">
            {user.name.slice(0, 1).toUpperCase()}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-foreground">
              {user.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
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
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-background px-3 text-xs font-bold text-muted-foreground shadow-sm transition hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="size-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSkipLink targetId="main-content" />

      <div className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block xl:w-72">
        <aside className="flex h-full flex-col border-r border-border bg-card">
          <div className="flex h-20 items-center gap-3 border-b border-border px-6">
            <Link
              href={portalHome}
              className="grid size-11 place-items-center rounded-2xl bg-brand text-brand-foreground shadow-sm"
            >
              <Building2 className="size-5" />
            </Link>

            <div className="min-w-0">
              <p className="truncate text-base font-black text-foreground">
                PropertyGoJB
              </p>
              <p className="text-xs font-bold uppercase tracking-wide text-brand">
                {portalLabel}
              </p>
            </div>
          </div>

          {sidebarNav}
          {sidebarFooter}
        </aside>
      </div>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-xl lg:hidden">
        <Link href={portalHome} className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-brand text-brand-foreground">
            <Sparkles className="size-5" />
          </span>

          <div>
            <p className="text-sm font-black text-foreground">PropertyGoJB</p>
            <p className="text-xs font-bold uppercase tracking-wide text-brand">
              {portalLabel}
            </p>
          </div>
        </Link>

        <button
          type="button"
          ref={mobileMenuTriggerRef}
          onClick={() => setMobileOpen(true)}
          className="grid size-10 place-items-center rounded-xl border border-border bg-background text-foreground"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
      </header>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[85vw] max-w-sm gap-0 border-border bg-background p-0 lg:hidden"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            mobileMenuTriggerRef.current?.focus();
          }}
        >
          <SheetHeader className="flex-row items-center gap-3 border-b border-border px-6 py-5 text-left">
            <span className="grid size-10 place-items-center rounded-2xl bg-brand text-brand-foreground">
              <Building2 className="size-5" />
            </span>
            <div className="min-w-0">
              <SheetTitle className="truncate text-base font-black text-foreground">
                PropertyGoJB
              </SheetTitle>
              <p className="text-xs font-bold uppercase tracking-wide text-brand">
                {portalLabel}
              </p>
            </div>
          </SheetHeader>

          {sidebarNav}
          {sidebarFooter}
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64 xl:pl-72">{children}</div>
    </div>
  );
}
