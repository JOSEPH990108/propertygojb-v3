"use client";

import { FormEvent, useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import {
  AppSelect,
  type AppSelectOption,
} from "@/components/common/app-select";

type FilterOption = {
  value: string;
  label: string;
  description?: string;
};

type PublicProjectsFiltersProps = {
  filters: {
    q: string;
    regionId: string;
    areaId: string;
    statusId: string;
    propertyTypeId: string;
  };
  regionOptions: FilterOption[];
  areaOptions: FilterOption[];
  statusOptions: FilterOption[];
  propertyTypeOptions: FilterOption[];
};

function toSelectOptions(
  options: FilterOption[],
  includeAll = true,
): AppSelectOption[] {
  return [
    ...(includeAll ? [{ value: "", label: "All" }] : []),
    ...options.map((option) => ({
      value: option.value,
      label: option.label,
      description: option.description,
    })),
  ];
}

export function PublicProjectsFilters({
  filters,
  regionOptions,
  areaOptions,
  statusOptions,
  propertyTypeOptions,
}: PublicProjectsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState(filters.q);
  const [regionId, setRegionId] = useState(filters.regionId);
  const [areaId, setAreaId] = useState(filters.areaId);
  const [statusId, setStatusId] = useState(filters.statusId);
  const [propertyTypeId, setPropertyTypeId] = useState(filters.propertyTypeId);

  const filteredAreaOptions = useMemo(() => {
    if (!regionId) {
      return areaOptions;
    }

    return areaOptions.filter(
      (option) => option.description === regionId || !option.description,
    );
  }, [areaOptions, regionId]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();

    if (query.trim()) {
      params.set("q", query.trim());
    }

    if (regionId) {
      params.set("regionId", regionId);
    }

    if (areaId) {
      params.set("areaId", areaId);
    }

    if (statusId) {
      params.set("statusId", statusId);
    }

    if (propertyTypeId) {
      params.set("propertyTypeId", propertyTypeId);
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }

  function handleReset() {
    setQuery("");
    setRegionId("");
    setAreaId("");
    setStatusId("");
    setPropertyTypeId("");
    router.push(pathname, { scroll: false });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-none border border-border bg-background/95 p-5 text-foreground shadow-sm backdrop-blur"
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr_0.9fr_auto_auto] lg:items-end">
        <label className="space-y-2 lg:col-span-1">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Search
          </span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Project, developer, location..."
              className="h-14 w-full rounded-2xl border border-border bg-background pl-11 pr-4 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </label>

        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Location
          </span>
          <AppSelect
            value={regionId}
            options={toSelectOptions(regionOptions)}
            onValueChange={(value) => {
              setRegionId(value);
              setAreaId("");
            }}
            placeholder="All Locations"
            searchable
            triggerClassName="h-14 w-full rounded-2xl bg-background"
          />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Area
          </span>
          <AppSelect
            value={areaId}
            options={toSelectOptions(filteredAreaOptions)}
            onValueChange={setAreaId}
            placeholder="All Areas"
            searchable
            triggerClassName="h-14 w-full rounded-2xl bg-background"
          />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Status
          </span>
          <AppSelect
            value={statusId}
            options={toSelectOptions(statusOptions)}
            onValueChange={setStatusId}
            placeholder="All Statuses"
            searchable
            triggerClassName="h-14 w-full rounded-2xl bg-background"
          />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Type
          </span>
          <AppSelect
            value={propertyTypeId}
            options={toSelectOptions(propertyTypeOptions)}
            onValueChange={setPropertyTypeId}
            placeholder="All Types"
            searchable
            triggerClassName="h-14 w-full rounded-2xl bg-background"
          />
        </div>

        <button
          type="submit"
          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-foreground px-5 text-sm font-black text-background shadow-sm transition hover:opacity-85"
        >
          <Filter className="size-4" />
          Apply
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex h-14 items-center justify-center rounded-2xl border border-border bg-background px-5 text-sm font-black text-foreground transition hover:bg-muted"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
