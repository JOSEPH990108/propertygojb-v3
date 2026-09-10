import type { ReactNode } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CalendarClock,
  LayoutDashboard,
  MessageSquareText,
  UserRound,
} from "lucide-react";

const accountNavigation = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/profile", label: "Profile", icon: UserRound },
  { href: "/account/enquiries", label: "Enquiries", icon: MessageSquareText },
  { href: "/account/viewings", label: "Viewings", icon: CalendarClock },
  { href: "/account/bookings", label: "Bookings", icon: CalendarCheck },
];

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-[70vh] bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
            Customer account
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">
            Your PropertyGoJB journey
          </h1>
        </div>

        <nav
          className="mb-8 flex gap-2 overflow-x-auto pb-2"
          aria-label="Account navigation"
        >
          {accountNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-bold text-foreground shadow-sm transition hover:border-blue-300 hover:text-blue-700"
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </div>
  );
}
