import Link from "next/link";
import { asc } from "drizzle-orm";
import { ArrowLeft, MapPin } from "lucide-react";

import { LocationManager } from "@/components/admin/settings/location-manager";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { db, schema } from "@/db";

export default async function LocationManagementPage() {
  const [states, regions, areas] = await Promise.all([
    db
      .select({
        id: schema.states.id,
        name: schema.states.name,
        slug: schema.states.slug,
        country: schema.states.country,
      })
      .from(schema.states)
      .orderBy(asc(schema.states.name)),

    db
      .select({
        id: schema.regions.id,
        stateId: schema.regions.stateId,
        name: schema.regions.name,
        slug: schema.regions.slug,
      })
      .from(schema.regions)
      .orderBy(asc(schema.regions.name)),

    db
      .select({
        id: schema.areas.id,
        regionId: schema.areas.regionId,
        name: schema.areas.name,
        slug: schema.areas.slug,
      })
      .from(schema.areas)
      .orderBy(asc(schema.areas.name)),
  ]);

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
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-3xl bg-blue-100 text-blue-700">
              <MapPin className="size-6" />
            </span>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
                Settings
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Location Management
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage State → Region → Area. Project forms will filter area
                based on the selected region.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <AppStatusBadge tone="info">{states.length} States</AppStatusBadge>
            <AppStatusBadge tone="success">{regions.length} Regions</AppStatusBadge>
            <AppStatusBadge tone="warning">{areas.length} Areas</AppStatusBadge>
          </div>
        </div>
      </section>

      <LocationManager states={states} regions={regions} areas={areas} />
    </main>
  );
}
