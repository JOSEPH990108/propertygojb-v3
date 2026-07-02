import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  ClipboardList,
  FileText,
  FolderKanban,
  Settings,
  Sparkles,
  UserRound,
  UsersRound,
  Warehouse,
} from "lucide-react";

import { AppStatusBadge } from "@/components/common/app-status-badge";

type ComingSoonIconKey =
  | "projects"
  | "properties"
  | "leads"
  | "bookings"
  | "customers"
  | "documents"
  | "appointments"
  | "reports"
  | "settings"
  | "agents"
  | "users";

type InternalComingSoonPageProps = {
  title: string;
  eyebrow: string;
  description: string;
  icon: ComingSoonIconKey;
  backHref: string;
  backLabel: string;
  features: string[];
};

const iconMap: Record<ComingSoonIconKey, ReactNode> = {
  projects: <FolderKanban className="size-6" />,
  properties: <Warehouse className="size-6" />,
  leads: <ClipboardList className="size-6" />,
  bookings: <FileText className="size-6" />,
  customers: <UsersRound className="size-6" />,
  documents: <FileText className="size-6" />,
  appointments: <CalendarCheck className="size-6" />,
  reports: <BarChart3 className="size-6" />,
  settings: <Settings className="size-6" />,
  agents: <BriefcaseBusiness className="size-6" />,
  users: <UserRound className="size-6" />,
};

export function InternalComingSoonPage({
  title,
  eyebrow,
  description,
  icon,
  backHref,
  backLabel,
  features,
}: InternalComingSoonPageProps) {
  return (
    <main className="space-y-8 p-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="relative bg-gradient-to-br from-slate-950 via-blue-800 to-blue-600 p-8 text-white">
          <div className="absolute -right-10 -top-10 size-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 right-28 size-36 rounded-full bg-cyan-300/20 blur-2xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-5">
              <span className="grid size-16 place-items-center rounded-3xl bg-white/15 text-white ring-1 ring-white/20">
                {iconMap[icon]}
              </span>

              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-100">
                  {eyebrow}
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight">
                  {title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                  {description}
                </p>
              </div>
            </div>

            <AppStatusBadge tone="warning">Coming Soon</AppStatusBadge>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-blue-100 text-blue-700">
                <Sparkles className="size-5" />
              </span>

              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-950">
                  Planned Features
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  This module is prepared for the next implementation phase.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-black text-blue-700">
                    ✓
                  </span>
                  <p className="text-sm font-semibold text-slate-700">
                    {feature}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-blue-100 bg-blue-50/70 p-6">
            <div className="grid size-12 place-items-center rounded-2xl bg-white text-blue-700 shadow-sm">
              <Building2 className="size-6" />
            </div>

            <h2 className="mt-5 text-xl font-black tracking-tight text-slate-950">
              Foundation Ready
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The route and layout are ready. We can connect database schema,
              APIs, forms, and tables when this module starts.
            </p>

            <Link
              href={backHref}
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              {backLabel}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
