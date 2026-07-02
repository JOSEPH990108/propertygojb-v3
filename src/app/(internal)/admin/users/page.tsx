import { asc, desc, eq, ilike, or } from "drizzle-orm";
import { ShieldCheck, Smartphone, UserRound } from "lucide-react";

import { UserRoleSelect } from "@/components/admin/users/user-role-select";
import { AppSearchInput } from "@/components/common/app-search-input";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { Badge } from "@/components/ui/badge";
import { db, schema } from "@/db";
import { getCurrentAuthContext } from "@/lib/auth/guards";

type AdminUsersPageProps = {
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


export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const authContext = await getCurrentAuthContext();
  const currentUser = authContext.user as { id?: unknown };

  const roles = await db
    .select({
      id: schema.roles.id,
      code: schema.roles.code,
      name: schema.roles.name,
      sortOrder: schema.roles.sortOrder,
    })
    .from(schema.roles)
    .where(eq(schema.roles.isActive, true))
    .orderBy(asc(schema.roles.sortOrder), asc(schema.roles.name));

  const searchCondition = query
    ? or(
        ilike(schema.user.name, `%${query}%`),
        ilike(schema.user.email, `%${query}%`),
        ilike(schema.user.phoneNumber, `%${query}%`),
      )
    : undefined;

  const users = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      phoneNumber: schema.user.phoneNumber,
      phoneNumberVerified: schema.user.phoneNumberVerified,
      emailVerified: schema.user.emailVerified,
      createdAt: schema.user.createdAt,
      roleId: schema.roles.id,
      roleCode: schema.roles.code,
      roleName: schema.roles.name,
    })
    .from(schema.user)
    .leftJoin(schema.roles, eq(schema.user.roleId, schema.roles.id))
    .where(searchCondition)
    .orderBy(desc(schema.user.createdAt))
    .limit(50);

  return (
    <main className="space-y-8 p-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
              Admin Control
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              User Management
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              View registered users, check verification status, and assign portal
              roles for admin, agent, and customer access.
            </p>
          </div>

          <AppSearchInput
            initialValue={query}
            placeholder="Search name, email, or mobile..."
            className="w-full max-w-md"
          />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-100 text-blue-700">
                <UserRound className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Showing Users
                </p>
                <p className="text-2xl font-black text-slate-950">
                  {users.length}
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
                  {users.filter((user) => user.phoneNumberVerified).length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-purple-100 text-purple-700">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Available Roles
                </p>
                <p className="text-2xl font-black text-slate-950">
                  {roles.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold">User</th>
                <th className="px-6 py-4 font-bold">Email</th>
                <th className="px-6 py-4 text-center font-bold">Mobile</th>
                <th className="px-6 py-4 text-center font-bold">Assign Role</th>
                <th className="px-6 py-4 font-bold">Created</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const isCurrentUser = currentUser.id === user.id;

                return (
                  <tr key={user.id} className="transition hover:bg-slate-50/80">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-full bg-blue-100 text-sm font-black text-blue-700">
                          {user.name.slice(0, 1).toUpperCase()}
                        </span>

                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-950">
                              {user.name}
                            </p>
                            {isCurrentUser ? (
                              <Badge variant="secondary">You</Badge>
                            ) : null}
                          </div>

                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <p className="max-w-[280px] truncate text-sm font-medium text-slate-600">
                        {user.email}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <p className="font-semibold text-slate-700">
                          {user.phoneNumber ?? "-"}
                        </p>
                        <AppStatusBadge
                          tone={user.phoneNumberVerified ? "success" : "danger"}
                        >
                          {user.phoneNumberVerified ? "Verified" : "Unverified"}
                        </AppStatusBadge>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <UserRoleSelect
                          userId={user.id}
                          currentRoleCode={user.roleCode ?? "CUSTOMER"}
                          roles={roles}
                          disabled={isCurrentUser}
                        />
                        {isCurrentUser ? (
                          <p className="mt-2 text-xs text-slate-400">
                            Self role change disabled.
                          </p>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-slate-500">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      No users found.
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Try another search keyword.
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
