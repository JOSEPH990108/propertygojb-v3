import type { ReactNode } from "react";

import Link from "next/link";

import {
  ArrowRight,
  Building2,
  Home,
  Layers3,
  Search,
  Tags,
  Warehouse,
} from "lucide-react";

import { AppStatusBadge } from "@/components/common/app-status-badge";
import { formatMoney } from "@/lib/bookings/format";
import type { PropertyInventory } from "@/lib/properties/inventory";

type PropertyInventoryViewProps = {
  portal: "admin" | "agent";
  inventory: PropertyInventory;
  search?: string;
};

function getProjectName(project: {
  projectDisplayName: string | null;
  projectName: string;
}) {
  return project.projectDisplayName ?? project.projectName;
}

function getUnitProjectName(unit: {
  projectDisplayName: string | null;
  projectName: string;
}) {
  return unit.projectDisplayName ?? unit.projectName;
}

function getStatusTone(
  statusCode: string,
): "success" | "danger" | "warning" | "info" | "neutral" {
  switch (statusCode) {
    case "AVAILABLE":
    case "READY":
    case "OPEN":
      return "success";
    case "RESERVED":
    case "BOOKED":
    case "PENDING":
      return "warning";
    case "SOLD":
    case "COMPLETED":
      return "danger";
    default:
      return "neutral";
  }
}

function formatSqft(value: string | number | null) {
  if (!value) {
    return "-";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return `${number.toLocaleString("en-MY")} sqft`;
}

function MetricCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint: string;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid size-11 place-items-center rounded-2xl bg-slate-50 text-slate-700">
        {icon}
      </div>
      <p className="mt-5 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-sm font-black text-slate-700">{label}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
        {hint}
      </p>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">
      {children}
    </div>
  );
}

export function PropertyInventoryView({
  portal,
  inventory,
  search = "",
}: PropertyInventoryViewProps) {
  const accent = portal === "admin" ? "blue" : "emerald";

  return (
    <div className="space-y-8 p-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p
              className={`text-sm font-black uppercase tracking-[0.28em] ${
                accent === "blue" ? "text-blue-600" : "text-emerald-600"
              }`}
            >
              {portal === "admin" ? "Admin Property Inventory" : "Agent Property Inventory"}
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Properties
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
              View project inventory, unit availability, layout information,
              lot type, booking status, and pricing overview.
            </p>
          </div>

          <form className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search className="size-4 text-slate-400" />
            <input
              name="q"
              defaultValue={search}
              placeholder="Search project, unit, layout, status..."
              className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
            />
          </form>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          icon={<Building2 className="size-5" />}
          label="Projects"
          value={inventory.metrics.totalProjects}
          hint="Projects with matching units"
        />

        <MetricCard
          icon={<Home className="size-5" />}
          label="Units"
          value={inventory.metrics.totalUnits}
          hint="Showing latest matching units"
        />

        <MetricCard
          icon={<Warehouse className="size-5" />}
          label="Available"
          value={inventory.metrics.availableUnits}
          hint="Open inventory units"
        />

        <MetricCard
          icon={<Layers3 className="size-5" />}
          label="Reserved / Booked"
          value={inventory.metrics.reservedUnits}
          hint="Units currently locked"
        />

        <MetricCard
          icon={<Tags className="size-5" />}
          label="Sold"
          value={inventory.metrics.soldUnits}
          hint="Completed inventory units"
        />
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              Project Inventory Summary
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Grouped by project based on current search result.
            </p>
          </div>

          {portal === "admin" ? (
            <Link
              href="/admin/projects"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white shadow-sm transition hover:bg-slate-800"
            >
              Manage Projects
              <ArrowRight className="size-3.5" />
            </Link>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {inventory.projects.map((project) => {
            const available = project.units.filter((unit) =>
              ["AVAILABLE", "READY", "OPEN"].includes(unit.bookingStatusCode),
            ).length;

            const reserved = project.units.filter((unit) =>
              ["RESERVED", "BOOKED", "PENDING"].includes(unit.bookingStatusCode),
            ).length;

            const sold = project.units.filter((unit) =>
              ["SOLD", "COMPLETED"].includes(unit.bookingStatusCode),
            ).length;

            return (
              <article
                key={project.projectId}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-black text-slate-950">
                      {getProjectName(project)}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {project.units.length} matching units ·{" "}
                      {project.totalUnitsDeclared} declared total
                    </p>
                  </div>

                  <AppStatusBadge tone={project.isPublished ? "success" : "neutral"}>
                    {project.isPublished ? "Published" : "Draft"}
                  </AppStatusBadge>
                </div>

                <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
                  <div className="rounded-xl bg-white px-4 py-3">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Available
                    </p>
                    <p className="mt-1 text-lg font-black text-slate-950">
                      {available}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white px-4 py-3">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Reserved
                    </p>
                    <p className="mt-1 text-lg font-black text-slate-950">
                      {reserved}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white px-4 py-3">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Sold
                    </p>
                    <p className="mt-1 text-lg font-black text-slate-950">
                      {sold}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}

          {inventory.projects.length === 0 ? (
            <EmptyState>No project inventory found.</EmptyState>
          ) : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 p-6 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              Unit Inventory
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Latest 300 matching units.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] table-fixed">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
            </colgroup>

            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Unit</th>
                <th className="px-6 py-4">Layout</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {inventory.units.map((unit) => (
                <tr key={unit.unitId} className="align-top transition hover:bg-slate-50">
                  <td className="px-6 py-5">
                    <p className="font-black text-slate-950">
                      {getUnitProjectName(unit)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {unit.projectSlug}
                    </p>
                  </td>

                  <td className="px-6 py-5">
                    <p className="font-black text-slate-950">{unit.unitNo}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Floor {unit.floor ?? "-"} · Stack {unit.stack ?? "-"}
                    </p>
                    {unit.streetName ? (
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {unit.streetName}
                      </p>
                    ) : null}
                  </td>

                  <td className="px-6 py-5">
                    <p className="font-black text-slate-950">
                      {unit.layoutCode ?? "-"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {unit.bedrooms ?? "-"}R {unit.bathrooms ?? "-"}B
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {unit.lotTypeName}
                    </p>
                  </td>

                  <td className="px-6 py-5">
                    <p className="font-black text-slate-950">
                      {formatSqft(unit.builtUpSqft)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Land {formatSqft(unit.landAreaSqft)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {unit.dimensionText ?? "-"}
                    </p>
                  </td>

                  <td className="px-6 py-5">
                    <p className="font-black text-slate-950">
                      {formatMoney(unit.finalPrice ?? unit.basePrice, "MYR")}
                    </p>
                    {unit.finalPrice ? (
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        SPA {formatMoney(unit.basePrice, "MYR")}
                      </p>
                    ) : null}
                  </td>

                  <td className="px-6 py-5">
                    <AppStatusBadge tone={getStatusTone(unit.bookingStatusCode)}>
                      {unit.bookingStatusName}
                    </AppStatusBadge>
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Facing {unit.facing ?? "-"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {unit.carparkCount} carpark
                    </p>
                  </td>

                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/${portal}/properties/${unit.unitId}`}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white shadow-sm transition hover:bg-slate-800"
                      >
                        Detail
                        <ArrowRight className="size-3.5" />
                      </Link>

                      <Link
                        href={`/${portal}/projects/${unit.projectId}`}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                      >
                        Project
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {inventory.units.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm font-semibold text-slate-500"
                  >
                    No unit inventory found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
