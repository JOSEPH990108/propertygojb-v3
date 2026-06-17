import Link from "next/link";
import {
  ArrowRight,
  Database,
  FolderKanban,
  MapPin,
  SlidersHorizontal,
} from "lucide-react";

import { AppStatusBadge } from "@/components/common/app-status-badge";

function SettingsCard({
  href,
  icon,
  title,
  description,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">{title}</h2>
            <ArrowRight className="size-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {description}
          </p>

          <div className="mt-4">
            <AppStatusBadge tone="info">{badge}</AppStatusBadge>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function AdminSettingsPage() {
  return (
    <main className="space-y-8 p-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="relative bg-gradient-to-br from-slate-950 via-blue-800 to-blue-600 p-8 text-white">
          <div className="absolute -right-10 -top-10 size-56 rounded-full bg-white/10 blur-2xl" />

          <div className="relative">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-100">
              Admin Module
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">
              System Settings
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
              Manage system lookup values, constants, and configuration modules.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <SettingsCard
          href="/admin/settings/lookups"
          icon={<Database className="size-5" />}
          title="Lookup Management"
          description="Manage reusable values such as project statuses, tenure types, booking statuses, and buyer types."
          badge="CRUD Ready"
        />

        <SettingsCard
          href="/admin/settings/property-types"
          icon={<FolderKanban className="size-5" />}
          title="Property Classification"
          description="Manage property category and property type relationship such as High Rise → Condo."
          badge="Next"
        />

        <SettingsCard
          href="/admin/settings/locations"
          icon={<MapPin className="size-5" />}
          title="Location Management"
          description="Manage states, regions, and areas for project location filtering."
          badge="Next"
        />

        <SettingsCard
          href="/admin/settings/system"
          icon={<SlidersHorizontal className="size-5" />}
          title="System Configuration"
          description="Future system preferences, feature flags, and integration settings."
          badge="Coming Soon"
        />
      </section>
    </main>
  );
}
