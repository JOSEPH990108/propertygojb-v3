import { and, desc, eq, ilike, or } from "drizzle-orm";
import {
  BriefcaseBusiness,
  IdCard,
  Smartphone,
} from "lucide-react";

import { AgentProfileForm } from "@/components/admin/agents/agent-profile-form";
import { AppSearchInput } from "@/components/common/app-search-input";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { db, schema } from "@/db";

type AdminAgentsPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

function formatDate(value: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function AdminAgentsPage({
  searchParams,
}: AdminAgentsPageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";

  const agentRole = await db.query.roles.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.code, "AGENT"), eq(table.isActive, true)),
    columns: {
      id: true,
      name: true,
    },
  });

  const searchCondition = query
    ? or(
        ilike(schema.user.name, `%${query}%`),
        ilike(schema.user.email, `%${query}%`),
        ilike(schema.user.phoneNumber, `%${query}%`),
        ilike(schema.user.renNumber, `%${query}%`),
        ilike(schema.user.agencyName, `%${query}%`),
        ilike(schema.user.referralCode, `%${query}%`),
      )
    : undefined;

  const agents = agentRole
    ? await db
        .select({
          id: schema.user.id,
          name: schema.user.name,
          email: schema.user.email,
          phoneNumber: schema.user.phoneNumber,
          phoneNumberVerified: schema.user.phoneNumberVerified,
          renNumber: schema.user.renNumber,
          agencyName: schema.user.agencyName,
          referralCode: schema.user.referralCode,
          createdAt: schema.user.createdAt,
        })
        .from(schema.user)
        .where(
          searchCondition
            ? and(eq(schema.user.roleId, agentRole.id), searchCondition)
            : eq(schema.user.roleId, agentRole.id),
        )
        .orderBy(desc(schema.user.createdAt))
        .limit(50)
    : [];

  return (
    <main className="space-y-8 p-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
              Admin Control
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Agent Management
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage agent profile details, REN number, agency name, and referral
              code for users assigned with the agent role.
            </p>
          </div>

          <AppSearchInput
            initialValue={query}
            placeholder="Search agent, mobile, REN, agency..."
            className="w-full max-w-md"
          />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-purple-100 text-purple-700">
                <BriefcaseBusiness className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Showing Agents
                </p>
                <p className="text-2xl font-black text-slate-950">
                  {agents.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                <Smartphone className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Mobile Verified
                </p>
                <p className="text-2xl font-black text-slate-950">
                  {agents.filter((agent) => agent.phoneNumberVerified).length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-100 text-blue-700">
                <IdCard className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  REN Completed
                </p>
                <p className="text-2xl font-black text-slate-950">
                  {agents.filter((agent) => Boolean(agent.renNumber)).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold">Agent</th>
                <th className="px-6 py-4 font-bold">Email</th>
                <th className="px-6 py-4 text-center font-bold">Mobile</th>
                <th className="px-6 py-4 font-bold">Agent Profile</th>
                <th className="px-6 py-4 font-bold">Created</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {agents.map((agent) => (
                <tr key={agent.id} className="transition hover:bg-slate-50/80">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-full bg-purple-100 text-sm font-black text-purple-700">
                        {agent.name.slice(0, 1).toUpperCase()}
                      </span>

                      <div>
                        <p className="font-bold text-slate-950">
                          {agent.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Agent Role
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <p className="max-w-[260px] truncate text-sm font-medium text-slate-600">
                      {agent.email}
                    </p>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <p className="font-semibold text-slate-700">
                        {agent.phoneNumber ?? "-"}
                      </p>
                      <AppStatusBadge
                        tone={agent.phoneNumberVerified ? "success" : "danger"}
                      >
                        {agent.phoneNumberVerified ? "Verified" : "Unverified"}
                      </AppStatusBadge>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <AgentProfileForm
                      userId={agent.id}
                      renNumber={agent.renNumber}
                      agencyName={agent.agencyName}
                      referralCode={agent.referralCode}
                    />
                  </td>

                  <td className="px-6 py-5 text-slate-500">
                    {formatDate(agent.createdAt)}
                  </td>
                </tr>
              ))}

              {agents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      No agents found.
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Assign a user as AGENT from User Management first.
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
