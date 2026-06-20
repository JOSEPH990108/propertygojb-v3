import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Database,
  FolderKanban,
  MapPin,
} from "lucide-react";

import { AppStatusBadge } from "@/components/common/app-status-badge";
import { getSimpleLookupConfigList } from "@/lib/admin/simple-lookups";

const specialLookupGroups = [
  {
    key: "property-types",
    href: "/admin/settings/property-types",
    title: "Property Types",
    description:
      "Manage property category to property type relationship, such as Landed → Cluster House or High Rise → Condominium.",
    badge: "Parent-child",
    icon: FolderKanban,
  },
  {
    key: "locations",
    href: "/admin/settings/locations",
    title: "Locations",
    description:
      "Manage State → Region → Area relationship for project location filtering.",
    badge: "Parent-child",
    icon: MapPin,
  },
];

export default function LookupManagementPage() {
  const lookups = getSimpleLookupConfigList();
  const totalGroups = lookups.length + specialLookupGroups.length;

  return (
    <main className="space-y-8 p-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-2 text-sm font-bold text-blue-600"
        >
          <ArrowLeft className="size-4" />
          Back to Settings
        </Link>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
              Settings
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Lookup Management
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage reusable system lookup values. Parent-child lookup groups
              are included here but open in their own dedicated screens.
            </p>
          </div>

          <AppStatusBadge tone="info">
            {totalGroups} Lookup Groups
          </AppStatusBadge>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-950">
            Relationship Lookups
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            These lookup groups need special handling because they depend on a
            parent selection.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {specialLookupGroups.map((lookup) => {
            const Icon = lookup.icon;

            return (
              <Link
                key={lookup.key}
                href={lookup.href}
                className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                    <Icon className="size-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-black text-slate-950">
                        {lookup.title}
                      </h3>
                      <ArrowRight className="size-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {lookup.description}
                    </p>

                    <div className="mt-4">
                      <AppStatusBadge tone="warning">
                        {lookup.badge}
                      </AppStatusBadge>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-950">
            Simple Lookups
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            These lookup groups support create, edit, enable, disable, soft
            delete, restore, and permanent delete.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {lookups.map((lookup) => (
            <Link
              key={lookup.key}
              href={`/admin/settings/lookups/${lookup.key}`}
              className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                  <Database className="size-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-black text-slate-950">
                      {lookup.title}
                    </h3>
                    <ArrowRight className="size-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {lookup.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
