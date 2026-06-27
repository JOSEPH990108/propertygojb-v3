"use client";

import type { ReactNode } from "react";
import { FormEvent, useMemo, useState } from "react";

import { usePathname, useRouter } from "next/navigation";

import { Building2, Download, Filter, Home, Search, Tags } from "lucide-react";

import { AppSelect, type AppSelectOption } from "@/components/common/app-select";
import type { PropertyInventoryFilterOptions } from "@/lib/properties/inventory";

type PropertyInventoryFiltersProps = {
  portal: "admin" | "agent";
  filters: {
    search: string;
    projectId: string;
    bookingStatusId: string;
    lotTypeId: string;
  };
  filterOptions: PropertyInventoryFilterOptions;
};

function buildOption({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: ReactNode;
}): AppSelectOption {
  return {
    value,
    label,
    leading: (
      <span className="grid size-9 place-items-center rounded-2xl bg-slate-50 text-slate-600">
        {icon}
      </span>
    ),
  };
}

function buildExportHref({
  portal,
  search,
  projectId,
  bookingStatusId,
  lotTypeId,
}: {
  portal: "admin" | "agent";
  search: string;
  projectId: string;
  bookingStatusId: string;
  lotTypeId: string;
}) {
  const params = new URLSearchParams();
  params.set("portal", portal);

  if (search.trim()) {
    params.set("q", search.trim());
  }

  if (projectId) {
    params.set("project", projectId);
  }

  if (bookingStatusId) {
    params.set("status", bookingStatusId);
  }

  if (lotTypeId) {
    params.set("lotType", lotTypeId);
  }

  return `/api/internal/properties/export?${params.toString()}`;
}

export function PropertyInventoryFilters({
  portal,
  filters,
  filterOptions,
}: PropertyInventoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(filters.search);
  const [projectId, setProjectId] = useState(filters.projectId);
  const [bookingStatusId, setBookingStatusId] = useState(filters.bookingStatusId);
  const [lotTypeId, setLotTypeId] = useState(filters.lotTypeId);

  const projectOptions = useMemo<AppSelectOption[]>(
    () => [
      buildOption({
        value: "",
        label: "All Projects",
        icon: <Building2 className="size-4" />,
      }),
      ...filterOptions.projects.map((project) =>
        buildOption({
          value: project.id,
          label: project.displayName ?? project.name,
          icon: <Building2 className="size-4" />,
        }),
      ),
    ],
    [filterOptions.projects],
  );

  const statusOptions = useMemo<AppSelectOption[]>(
    () => [
      buildOption({
        value: "",
        label: "All Statuses",
        icon: <Home className="size-4" />,
      }),
      ...filterOptions.bookingStatuses.map((status) =>
        buildOption({
          value: status.id,
          label: status.name,
          icon: <Home className="size-4" />,
        }),
      ),
    ],
    [filterOptions.bookingStatuses],
  );

  const lotTypeOptions = useMemo<AppSelectOption[]>(
    () => [
      buildOption({
        value: "",
        label: "All Lot Types",
        icon: <Tags className="size-4" />,
      }),
      ...filterOptions.lotTypes.map((lotType) =>
        buildOption({
          value: lotType.id,
          label: lotType.name,
          icon: <Tags className="size-4" />,
        }),
      ),
    ],
    [filterOptions.lotTypes],
  );

  function applyFilters(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("q", search.trim());
    }

    if (projectId) {
      params.set("project", projectId);
    }

    if (bookingStatusId) {
      params.set("status", bookingStatusId);
    }

    if (lotTypeId) {
      params.set("lotType", lotTypeId);
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  function resetFilters() {
    setSearch("");
    setProjectId("");
    setBookingStatusId("");
    setLotTypeId("");
    router.push(pathname);
  }

  return (
    <form
      onSubmit={applyFilters}
      className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr_1fr_auto_auto_auto] xl:items-end">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Search
          </label>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Project, unit, layout..."
              className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Project
          </label>
          <AppSelect
            value={projectId}
            options={projectOptions}
            onValueChange={setProjectId}
            placeholder="All Projects"
            triggerClassName="h-14 w-full rounded-2xl bg-white"
            renderValue={(option) => (
              <span className="flex min-w-0 items-center gap-2">
                {option?.leading}
                <span className="truncate font-black">
                  {option?.label ?? "All Projects"}
                </span>
              </span>
            )}
            renderOption={(option) => (
              <>
                {option.leading}
                <span className="truncate font-bold">{option.label}</span>
              </>
            )}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Status
          </label>
          <AppSelect
            value={bookingStatusId}
            options={statusOptions}
            onValueChange={setBookingStatusId}
            placeholder="All Statuses"
            triggerClassName="h-14 w-full rounded-2xl bg-white"
            renderValue={(option) => (
              <span className="flex min-w-0 items-center gap-2">
                {option?.leading}
                <span className="truncate font-black">
                  {option?.label ?? "All Statuses"}
                </span>
              </span>
            )}
            renderOption={(option) => (
              <>
                {option.leading}
                <span className="truncate font-bold">{option.label}</span>
              </>
            )}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Lot Type
          </label>
          <AppSelect
            value={lotTypeId}
            options={lotTypeOptions}
            onValueChange={setLotTypeId}
            placeholder="All Lot Types"
            triggerClassName="h-14 w-full rounded-2xl bg-white"
            renderValue={(option) => (
              <span className="flex min-w-0 items-center gap-2">
                {option?.leading}
                <span className="truncate font-black">
                  {option?.label ?? "All Lot Types"}
                </span>
              </span>
            )}
            renderOption={(option) => (
              <>
                {option.leading}
                <span className="truncate font-bold">{option.label}</span>
              </>
            )}
          />
        </div>

        <button
          type="submit"
          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
        >
          <Filter className="size-4" />
          Apply
        </button>

        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-700 transition hover:bg-slate-50"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
