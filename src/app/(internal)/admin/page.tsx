import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
  Smartphone,
  UserCog,
  UsersRound,
} from "lucide-react";
import { desc, eq } from "drizzle-orm";

import { AppStatusBadge } from "@/components/common/app-status-badge";
import { db, schema } from "@/db";

function formatDate(value: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function MetricCard({
  icon,
  label,
  value,
  description,
  tone = "info",
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  description: string;
  tone?: "success" | "danger" | "warning" | "info" | "neutral";
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-700">
          {icon}
        </span>

        <AppStatusBadge tone={tone}>Live</AppStatusBadge>
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

export default async function AdminDashboardPage() {

  const users = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      phoneNumber: schema.user.phoneNumber,
      phoneNumberVerified: schema.user.phoneNumberVerified,
      createdAt: schema.user.createdAt,
      roleCode: schema.roles.code,
      roleName: schema.roles.name,
    })
    .from(schema.user)
    .leftJoin(schema.roles, eq(schema.user.roleId, schema.roles.id))
    .orderBy(desc(schema.user.createdAt))
    .limit(100);

  const roles = await db
    .select({
      id: schema.roles.id,
      code: schema.roles.code,
      name: schema.roles.name,
      isActive: schema.roles.isActive,
    })
    .from(schema.roles);

  const totalUsers = users.length;
  const totalAgents = users.filter((user) => user.roleCode === "AGENT").length;
  const totalAdmins = users.filter(
    (user) => user.roleCode === "ADMIN" || user.roleCode === "SUPER_ADMIN",
  ).length;
  const mobileVerifiedUsers = users.filter(
    (user) => user.phoneNumberVerified,
  ).length;

  const latestUsers = users.slice(0, 5);

  return (
    <main className="space-y-8 p-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="relative bg-gradient-to-br from-slate-950 via-blue-800 to-blue-600 p-8 text-white">
          <div className="absolute -right-10 -top-10 size-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 right-28 size-36 rounded-full bg-cyan-300/20 blur-2xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-100">
                Admin Dashboard
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">
                PropertyGoJB Control Center
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                Manage users, agents, roles, and prepare the foundation for
                projects, leads, bookings, and customer workflows.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <AppStatusBadge tone="success">Auth Ready</AppStatusBadge>
              <AppStatusBadge tone="info">Phase 2B</AppStatusBadge>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<UsersRound className="size-5" />}
            label="Total Users"
            value={totalUsers}
            description="Registered users currently shown from latest records."
            tone="info"
          />

          <MetricCard
            icon={<BriefcaseBusiness className="size-5" />}
            label="Agents"
            value={totalAgents}
            description="Users assigned with AGENT role."
            tone="success"
          />

          <MetricCard
            icon={<ShieldCheck className="size-5" />}
            label="Admins"
            value={totalAdmins}
            description="Admin and Super Admin users."
            tone="warning"
          />

          <MetricCard
            icon={<Smartphone className="size-5" />}
            label="Mobile Verified"
            value={mobileVerifiedUsers}
            description="Users with verified mobile numbers."
            tone="success"
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
                Jump to the main admin control modules.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <QuickActionCard
              href="/admin/users"
              icon={<UserCog className="size-5" />}
              title="User Management"
              description="Search users, view verification status, and assign roles."
            />

            <QuickActionCard
              href="/admin/agents"
              icon={<BriefcaseBusiness className="size-5" />}
              title="Agent Management"
              description="Manage REN number, agency name, and referral code."
            />

            <QuickActionCard
              href="/admin/projects"
              icon={<Building2 className="size-5" />}
              title="Projects"
              description="Project management module will be added in a later phase."
            />

            <QuickActionCard
              href="/admin/leads"
              icon={<ClipboardList className="size-5" />}
              title="Leads"
              description="Lead routing and CRM module will connect here soon."
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
              <ShieldCheck className="size-5" />
            </span>

            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-950">
                Role Setup
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Active system roles available for access control.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
              >
                <div>
                  <p className="text-sm font-black text-slate-950">
                    {role.name}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">
                    {role.code}
                  </p>
                </div>

                <AppStatusBadge tone={role.isActive ? "success" : "danger"}>
                  {role.isActive ? "Active" : "Inactive"}
                </AppStatusBadge>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-950">
              Latest Users
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Recent user accounts created in the system.
            </p>
          </div>

          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600"
          >
            View all
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold">User</th>
                <th className="px-6 py-4 font-bold">Email</th>
                <th className="px-6 py-4 text-center font-bold">Mobile</th>
                <th className="px-6 py-4 text-center font-bold">Role</th>
                <th className="px-6 py-4 font-bold">Created</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {latestUsers.map((user) => (
                <tr key={user.id} className="transition hover:bg-slate-50/80">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-full bg-blue-100 text-sm font-black text-blue-700">
                        {user.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-bold text-slate-950">
                          {user.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {user.phoneNumber ?? "-"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <p className="max-w-[260px] truncate font-medium text-slate-600">
                      {user.email}
                    </p>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <AppStatusBadge
                      tone={user.phoneNumberVerified ? "success" : "danger"}
                    >
                      {user.phoneNumberVerified ? "Verified" : "Unverified"}
                    </AppStatusBadge>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <AppStatusBadge tone={user.roleCode ? "info" : "warning"}>
                      {user.roleCode ?? "NO_ROLE"}
                    </AppStatusBadge>
                  </td>

                  <td className="px-6 py-5 text-slate-500">
                    {formatDate(user.createdAt)}
                  </td>
                </tr>
              ))}

              {latestUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      No users found.
                    </p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
