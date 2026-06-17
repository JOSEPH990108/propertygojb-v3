import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  IdCard,
  Mail,
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

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700">
          {icon}
        </span>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="mt-1 truncate text-base font-bold text-slate-950">
            {value || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function AgentProfilePage() {
  const authContext = await requireRole(["AGENT", "SUPER_ADMIN"], "/agent/profile");
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
          <h1 className="text-xl font-black text-red-700">Profile not found</h1>
          <p className="mt-2 text-sm text-red-600">
            We could not load your agent profile.
          </p>
        </section>
      </main>
    );
  }

  const referralCode = user.referralCode ?? "";

  return (
    <main className="space-y-8 p-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-slate-950 p-8 text-white">
          <div className="absolute right-8 top-8 hidden size-40 rounded-full bg-white/10 blur-2xl sm:block" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-5">
              <span className="grid size-20 place-items-center rounded-3xl bg-white/15 text-3xl font-black ring-1 ring-white/20">
                {user.name.slice(0, 1).toUpperCase()}
              </span>

              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-100">
                  Agent Portal
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight">
                  {user.name}
                </h1>
                <p className="mt-2 text-sm text-blue-100">
                  Manage your profile identity and referral information.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <AppStatusBadge tone={user.phoneNumberVerified ? "success" : "danger"}>
                {user.phoneNumberVerified ? "Mobile Verified" : "Mobile Unverified"}
              </AppStatusBadge>

              <AppStatusBadge tone={user.emailVerified ? "success" : "warning"}>
                {user.emailVerified ? "Email Verified" : "Email Unverified"}
              </AppStatusBadge>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard
            icon={<UserRound className="size-5" />}
            label="Display Name"
            value={user.name}
          />
          <InfoCard
            icon={<Phone className="size-5" />}
            label="Mobile Number"
            value={user.phoneNumber ?? "-"}
          />
          <InfoCard
            icon={<Mail className="size-5" />}
            label="Email"
            value={user.email}
          />
          <InfoCard
            icon={<ShieldCheck className="size-5" />}
            label="Joined"
            value={formatDate(user.createdAt)}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-purple-100 text-purple-700">
              <BriefcaseBusiness className="size-5" />
            </span>

            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-950">
                Agent Details
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                These details are managed by admin.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <InfoCard
              icon={<IdCard className="size-5" />}
              label="REN Number"
              value={user.renNumber ?? "-"}
            />

            <InfoCard
              icon={<Building2 className="size-5" />}
              label="Agency Name"
              value={user.agencyName ?? "-"}
            />
          </div>

          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
              Referral Code
            </p>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="rounded-2xl bg-white px-4 py-3 font-mono text-lg font-black tracking-wide text-slate-950 shadow-sm">
                {referralCode || "Not assigned"}
              </p>

              <AppCopyButton
                value={referralCode}
                label="Copy Code"
                disabled={!referralCode}
              />
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
              <BadgeCheck className="size-5" />
            </span>

            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-950">
                Profile Status
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Agent readiness summary.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
              <span className="text-sm font-semibold text-slate-600">
                Mobile Verification
              </span>
              <AppStatusBadge tone={user.phoneNumberVerified ? "success" : "danger"}>
                {user.phoneNumberVerified ? "Done" : "Pending"}
              </AppStatusBadge>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
              <span className="text-sm font-semibold text-slate-600">
                REN Number
              </span>
              <AppStatusBadge tone={user.renNumber ? "success" : "warning"}>
                {user.renNumber ? "Completed" : "Missing"}
              </AppStatusBadge>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
              <span className="text-sm font-semibold text-slate-600">
                Referral Code
              </span>
              <AppStatusBadge tone={user.referralCode ? "success" : "warning"}>
                {user.referralCode ? "Assigned" : "Missing"}
              </AppStatusBadge>
            </div>
          </div>

          <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-700">
            Need to update your REN number, agency name, or referral code? Please
            contact admin for now.
          </p>
        </div>
      </section>
    </main>
  );
}
