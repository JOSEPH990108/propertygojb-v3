import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarCheck,
  ClipboardList,
  Home,
  IdCard,
  LayoutDashboard,
  MessageCircle,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { AppCopyButton } from "@/components/common/app-copy-button";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { db } from "@/db";
import { requireRole } from "@/lib/auth/guards";

function formatDate(value: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function DashboardMetricCard({
  icon,
  label,
  value,
  description,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-700">
          {icon}
        </span>

        <AppStatusBadge tone="neutral">Soon</AppStatusBadge>
      </div>

      <p className="mt-5 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-700">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function QuickActionCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-black text-slate-950">{title}</h3>
            <ArrowRight className="size-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default async function AgentDashboardPage() {
  const authContext = await requireRole(["AGENT", "SUPER_ADMIN"], "/agent");
  const currentUser = authContext.user as { id?: unknown };

  const userId = typeof currentUser.id === "string" ? currentUser.id : "";

  const user = await db.query.user.findFirst({
    where: (table, { eq }) => eq(table.id, userId),
    columns: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      phoneNumber: true,
      phoneNumberVerified: true,
      renNumber: true,
      agencyName: true,
      referralCode: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return (
      <main className="p-6">
        <section className="rounded-[2rem] border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-black text-red-700">
            Agent dashboard unavailable
          </h1>
          <p className="mt-2 text-sm text-red-600">
            We could not load your account information.
          </p>
        </section>
      </main>
    );
  }

  const readinessItems = [
    {
      label: "Mobile verified",
      completed: user.phoneNumberVerified,
    },
    {
      label: "REN number assigned",
      completed: Boolean(user.renNumber),
    },
    {
      label: "Agency name assigned",
      completed: Boolean(user.agencyName),
    },
    {
      label: "Referral code assigned",
      completed: Boolean(user.referralCode),
    },
  ];

  const completedCount = readinessItems.filter((item) => item.completed).length;
  const completionPercentage = Math.round(
    (completedCount / readinessItems.length) * 100,
  );

  return (
    <main className="space-y-8 p-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-slate-950 p-8 text-white">
          <div className="absolute -right-10 -top-10 size-52 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 right-24 size-32 rounded-full bg-cyan-300/20 blur-2xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-5">
              <span className="grid size-20 place-items-center rounded-3xl bg-white/15 text-3xl font-black ring-1 ring-white/20">
                {user.name.slice(0, 1).toUpperCase()}
              </span>

              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-100">
                  Agent Dashboard
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight">
                  Welcome back, {user.name}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                  Manage your profile, monitor upcoming lead and booking modules,
                  and keep your agent information ready for routing.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <AppStatusBadge tone={user.phoneNumberVerified ? "success" : "danger"}>
                {user.phoneNumberVerified ? "Mobile Verified" : "Mobile Missing"}
              </AppStatusBadge>

              <AppStatusBadge tone={user.referralCode ? "success" : "warning"}>
                {user.referralCode ? "Referral Ready" : "Referral Missing"}
              </AppStatusBadge>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            icon={<ClipboardList className="size-5" />}
            label="Assigned Leads"
            value="0"
            description="Lead module will connect here in the next phase."
          />

          <DashboardMetricCard
            icon={<CalendarCheck className="size-5" />}
            label="Appointments"
            value="0"
            description="Viewing and follow-up appointments will appear here."
          />

          <DashboardMetricCard
            icon={<Home className="size-5" />}
            label="Active Bookings"
            value="0"
            description="Booking pipeline will show agent-owned bookings."
          />

          <DashboardMetricCard
            icon={<MessageCircle className="size-5" />}
            label="WhatsApp Queue"
            value="0"
            description="Routing queue status will be available soon."
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-blue-100 text-blue-700">
              <LayoutDashboard className="size-5" />
            </span>

            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-950">
                Quick Actions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Jump to your most important agent tools.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <QuickActionCard
              href="/agent/profile"
              icon={<UserRound className="size-5" />}
              title="My Profile"
              description="View REN, agency, referral code, and account status."
            />

            <QuickActionCard
              href="/agent/leads"
              icon={<ClipboardList className="size-5" />}
              title="My Leads"
              description="Lead assignment page placeholder for upcoming CRM flow."
            />

            <QuickActionCard
              href="/agent/bookings"
              icon={<Home className="size-5" />}
              title="My Bookings"
              description="Track customer booking pipeline once booking module is ready."
            />

            <QuickActionCard
              href="/agent/appointments"
              icon={<CalendarCheck className="size-5" />}
              title="Appointments"
              description="Manage viewing and follow-up appointments later."
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
              <BadgeCheck className="size-5" />
            </span>

            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-950">
                Agent Readiness
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Complete profile details before lead routing starts.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-bold text-slate-700">
                  Profile completion
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {completedCount} of {readinessItems.length} items completed
                </p>
              </div>

              <p className="text-3xl font-black text-slate-950">
                {completionPercentage}%
              </p>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {readinessItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
              >
                <span className="text-sm font-semibold text-slate-600">
                  {item.label}
                </span>
                <AppStatusBadge tone={item.completed ? "success" : "warning"}>
                  {item.completed ? "Done" : "Pending"}
                </AppStatusBadge>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-blue-700">
                <IdCard className="size-5" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                  Referral Code
                </p>
                <p className="mt-1 truncate font-mono text-lg font-black tracking-wide text-slate-950">
                  {user.referralCode ?? "Not assigned"}
                </p>

                <div className="mt-3">
                  <AppCopyButton
                    value={user.referralCode ?? ""}
                    label="Copy Code"
                    disabled={!user.referralCode}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
              <Phone className="size-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Mobile
              </p>
              <p className="mt-1 text-sm font-bold text-slate-950">
                {user.phoneNumber ?? "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
              <BriefcaseBusiness className="size-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Agency
              </p>
              <p className="mt-1 text-sm font-bold text-slate-950">
                {user.agencyName ?? "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Last Updated
              </p>
              <p className="mt-1 text-sm font-bold text-slate-950">
                {formatDate(user.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
