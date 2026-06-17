"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { AppButton } from "@/components/common/app-button";
import { AppSelect } from "@/components/common/app-select";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";

type StateItem = {
  id: string;
  name: string;
  slug: string;
  country: string;
};

type RegionItem = {
  id: string;
  stateId: string;
  name: string;
  slug: string;
};

type AreaItem = {
  id: string;
  regionId: string;
  name: string;
  slug: string;
};

type LocationManagerProps = {
  states: StateItem[];
  regions: RegionItem[];
  areas: AreaItem[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function StateRow({ state }: { state: StateItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(state.name);
  const [slug, setSlug] = useState(state.slug);
  const [country, setCountry] = useState(state.country);

  function saveState() {
    startTransition(async () => {
      const result = await postJson("/api/admin/settings/locations", {
        action: "update-state",
        id: state.id,
        name,
        slug,
        country,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success("State updated.");
      router.refresh();
    });
  }

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-end">
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            State Name
          </span>
          <Input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setSlug(slugify(event.target.value));
            }}
            className="h-11 rounded-xl"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Slug
          </span>
          <Input
            value={slug}
            onChange={(event) => setSlug(slugify(event.target.value))}
            className="h-11 rounded-xl"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Country
          </span>
          <Input
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className="h-11 rounded-xl"
          />
        </label>

        <AppButton
          type="button"
          disabled={isPending}
          onClick={saveState}
          className="h-10 rounded-xl px-4 text-sm"
        >
          Save
        </AppButton>
      </div>
    </div>
  );
}

function RegionRow({
  region,
  states,
}: {
  region: RegionItem;
  states: StateItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [stateId, setStateId] = useState(region.stateId);
  const [name, setName] = useState(region.name);
  const [slug, setSlug] = useState(region.slug);

  function saveRegion() {
    startTransition(async () => {
      const result = await postJson("/api/admin/settings/locations", {
        action: "update-region",
        id: region.id,
        stateId,
        name,
        slug,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success("Region updated.");
      router.refresh();
    });
  }

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1.2fr_1fr_auto] lg:items-end">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            State
          </span>
          <AppSelect
            value={stateId}
            onValueChange={setStateId}
            placeholder="Select state"
            options={states.map((state) => ({
              value: state.id,
              label: state.name,
            }))}
            triggerClassName="h-11 w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-semibold"
            contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl"
          />
        </div>

        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Region Name
          </span>
          <Input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setSlug(slugify(event.target.value));
            }}
            className="h-11 rounded-xl"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Slug
          </span>
          <Input
            value={slug}
            onChange={(event) => setSlug(slugify(event.target.value))}
            className="h-11 rounded-xl"
          />
        </label>

        <AppButton
          type="button"
          disabled={isPending}
          onClick={saveRegion}
          className="h-10 rounded-xl px-4 text-sm"
        >
          Save
        </AppButton>
      </div>
    </div>
  );
}

function AreaRow({
  area,
  regions,
}: {
  area: AreaItem;
  regions: RegionItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [regionId, setRegionId] = useState(area.regionId);
  const [name, setName] = useState(area.name);
  const [slug, setSlug] = useState(area.slug);

  function saveArea() {
    startTransition(async () => {
      const result = await postJson("/api/admin/settings/locations", {
        action: "update-area",
        id: area.id,
        regionId,
        name,
        slug,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success("Area updated.");
      router.refresh();
    });
  }

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1.2fr_1fr_auto] lg:items-end">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Region
          </span>
          <AppSelect
            value={regionId}
            onValueChange={setRegionId}
            placeholder="Select region"
            options={regions.map((region) => ({
              value: region.id,
              label: region.name,
            }))}
            triggerClassName="h-11 w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-semibold"
            contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl"
          />
        </div>

        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Area Name
          </span>
          <Input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setSlug(slugify(event.target.value));
            }}
            className="h-11 rounded-xl"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Slug
          </span>
          <Input
            value={slug}
            onChange={(event) => setSlug(slugify(event.target.value))}
            className="h-11 rounded-xl"
          />
        </label>

        <AppButton
          type="button"
          disabled={isPending}
          onClick={saveArea}
          className="h-10 rounded-xl px-4 text-sm"
        >
          Save
        </AppButton>
      </div>
    </div>
  );
}

export function LocationManager({ states, regions, areas }: LocationManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [stateName, setStateName] = useState("");
  const [stateSlug, setStateSlug] = useState("");
  const [stateCountry, setStateCountry] = useState("Malaysia");

  const [regionStateId, setRegionStateId] = useState(states[0]?.id ?? "");
  const [regionName, setRegionName] = useState("");
  const [regionSlug, setRegionSlug] = useState("");

  const [areaRegionId, setAreaRegionId] = useState(regions[0]?.id ?? "");
  const [areaName, setAreaName] = useState("");
  const [areaSlug, setAreaSlug] = useState("");

  const groupedLocations = useMemo(() => {
    return states.map((state) => {
      const stateRegions = regions.filter((region) => region.stateId === state.id);

      return {
        state,
        regions: stateRegions.map((region) => ({
          region,
          areas: areas.filter((area) => area.regionId === region.id),
        })),
      };
    });
  }, [areas, regions, states]);

  function createState() {
    startTransition(async () => {
      const result = await postJson("/api/admin/settings/locations", {
        action: "create-state",
        name: stateName,
        slug: stateSlug,
        country: stateCountry,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      setStateName("");
      setStateSlug("");
      setStateCountry("Malaysia");

      appToast.success("State created.");
      router.refresh();
    });
  }

  function createRegion() {
    startTransition(async () => {
      const result = await postJson("/api/admin/settings/locations", {
        action: "create-region",
        stateId: regionStateId,
        name: regionName,
        slug: regionSlug,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      setRegionName("");
      setRegionSlug("");

      appToast.success("Region created.");
      router.refresh();
    });
  }

  function createArea() {
    startTransition(async () => {
      const result = await postJson("/api/admin/settings/locations", {
        action: "create-area",
        regionId: areaRegionId,
        name: areaName,
        slug: areaSlug,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      setAreaName("");
      setAreaSlug("");

      appToast.success("Area created.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-slate-950">
            Create State
          </h2>

          <div className="mt-6 grid gap-4">
            <Input
              value={stateName}
              onChange={(event) => {
                setStateName(event.target.value);
                setStateSlug(slugify(event.target.value));
              }}
              placeholder="Johor"
              className="h-11 rounded-xl"
            />
            <Input
              value={stateSlug}
              onChange={(event) => setStateSlug(slugify(event.target.value))}
              placeholder="johor"
              className="h-11 rounded-xl"
            />
            <Input
              value={stateCountry}
              onChange={(event) => setStateCountry(event.target.value)}
              placeholder="Malaysia"
              className="h-11 rounded-xl"
            />

            <AppButton
              type="button"
              disabled={isPending || !stateName.trim() || !stateSlug.trim()}
              onClick={createState}
              className="h-11 rounded-xl"
            >
              Create State
            </AppButton>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-slate-950">
            Create Region
          </h2>

          <div className="mt-6 grid gap-4">
            <AppSelect
              value={regionStateId}
              onValueChange={setRegionStateId}
              placeholder="Select state"
              options={states.map((state) => ({
                value: state.id,
                label: state.name,
              }))}
              triggerClassName="h-11 w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-semibold"
              contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl"
            />
            <Input
              value={regionName}
              onChange={(event) => {
                setRegionName(event.target.value);
                setRegionSlug(slugify(event.target.value));
              }}
              placeholder="Johor Bahru"
              className="h-11 rounded-xl"
            />
            <Input
              value={regionSlug}
              onChange={(event) => setRegionSlug(slugify(event.target.value))}
              placeholder="johor-bahru"
              className="h-11 rounded-xl"
            />

            <AppButton
              type="button"
              disabled={
                isPending ||
                !regionStateId ||
                !regionName.trim() ||
                !regionSlug.trim()
              }
              onClick={createRegion}
              className="h-11 rounded-xl"
            >
              Create Region
            </AppButton>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-slate-950">
            Create Area
          </h2>

          <div className="mt-6 grid gap-4">
            <AppSelect
              value={areaRegionId}
              onValueChange={setAreaRegionId}
              placeholder="Select region"
              options={regions.map((region) => ({
                value: region.id,
                label: region.name,
              }))}
              triggerClassName="h-11 w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-semibold"
              contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl"
            />
            <Input
              value={areaName}
              onChange={(event) => {
                setAreaName(event.target.value);
                setAreaSlug(slugify(event.target.value));
              }}
              placeholder="Skudai"
              className="h-11 rounded-xl"
            />
            <Input
              value={areaSlug}
              onChange={(event) => setAreaSlug(slugify(event.target.value))}
              placeholder="skudai"
              className="h-11 rounded-xl"
            />

            <AppButton
              type="button"
              disabled={
                isPending || !areaRegionId || !areaName.trim() || !areaSlug.trim()
              }
              onClick={createArea}
              className="h-11 rounded-xl"
            >
              Create Area
            </AppButton>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-black tracking-tight text-slate-950">
          States
        </h2>

        {states.map((state) => (
          <StateRow key={state.id} state={state} />
        ))}
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-black tracking-tight text-slate-950">
          Location Hierarchy
        </h2>

        {groupedLocations.map(({ state, regions: stateRegions }) => (
          <div
            key={state.id}
            className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-950">
                  {state.name}
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {state.country} / {state.slug}
                </p>
              </div>

              <AppStatusBadge tone="info">
                {stateRegions.length} Region(s)
              </AppStatusBadge>
            </div>

            <div className="mt-5 space-y-5">
              {stateRegions.map(({ region, areas: regionAreas }) => (
                <div
                  key={region.id}
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="font-black text-slate-950">
                        {region.name}
                      </h4>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {region.slug}
                      </p>
                    </div>

                    <AppStatusBadge tone="success">
                      {regionAreas.length} Area(s)
                    </AppStatusBadge>
                  </div>

                  <div className="mt-4 space-y-3">
                    <RegionRow region={region} states={states} />

                    {regionAreas.map((area) => (
                      <AreaRow key={area.id} area={area} regions={regions} />
                    ))}

                    {regionAreas.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                        <p className="text-sm font-bold text-slate-700">
                          No areas under this region.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}

              {stateRegions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
                  <p className="text-sm font-bold text-slate-700">
                    No regions under this state.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
