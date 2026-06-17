import Link from "next/link";
import { ArrowLeft, ArrowRight, Database } from "lucide-react";

import { AppStatusBadge } from "@/components/common/app-status-badge";
import { getSimpleLookupConfigList } from "@/lib/admin/simple-lookups";

export default function LookupManagementPage() {
  const lookups = getSimpleLookupConfigList();

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
              Manage reusable system lookup values. Disable instead of deleting
              when values may already be used by projects, leads, or bookings.
            </p>
          </div>

          <AppStatusBadge tone="info">{lookups.length} Lookup Groups</AppStatusBadge>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
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
                  <h2 className="text-lg font-black text-slate-950">
                    {lookup.title}
                  </h2>
                  <ArrowRight className="size-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {lookup.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
