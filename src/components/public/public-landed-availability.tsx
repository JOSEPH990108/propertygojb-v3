"use client";

import { useState } from "react";
import {
  ChevronDown,
  Compass,
  MapPin,
  MessageCircle,
  Ruler,
  X,
} from "lucide-react";

import { getPublicWhatsAppHref } from "@/lib/public/site";

type LandedUnit = {
  id: string;
  unitNo: string;
  layoutId: string | null;
  basePrice: string;
  finalPrice: string | null;
  builtUpSqft: string | null;
  landAreaSqft: string | null;
  dimensionText: string | null;
  facingTypeName: string | null;
  lotTypeName: string | null;
  positionTypeName: string | null;
  bookingStatusCode: string | null;
  bookingStatusName: string | null;
};

type Layout = {
  id: string;
  code: string;
  name: string | null;
  bedrooms: number;
  bathrooms: number;
  builtUpSqft: string;
};

type AvailabilityPlanDocument = { towerCode: string; plan: unknown };
type SitePlanTab = { code: string; label: string; layoutCodes: string[] };
type SitePlanLot = { unitNo: string; xNorm: number; yNorm: number };
type SitePlanMap = {
  tabCode: string;
  markerRadius: number;
  hitRadius: number;
  lots: SitePlanLot[];
};
type SitePlanRowGroup = { code: string; label: string; rows: string[][] };
type LandedSitePlan = {
  zoneCode: string;
  title: string;
  tabs: SitePlanTab[];
  maps: SitePlanMap[];
  rowGroups: SitePlanRowGroup[];
};
type DisplayStatus = "AVAILABLE" | "BOOKED" | "UNAVAILABLE";

const statusStyle: Record<
  DisplayStatus,
  { label: string; dot: string; lot: string; marker: string }
> = {
  AVAILABLE: {
    label: "Available",
    dot: "bg-blue-600",
    lot: "border-blue-300 bg-blue-50 text-blue-950 hover:border-blue-600 hover:bg-blue-100",
    marker: "fill-blue-600 stroke-white",
  },
  BOOKED: {
    label: "Booked / Sold",
    dot: "bg-red-500",
    lot: "border-red-200 bg-red-50 text-red-950 hover:border-red-500 hover:bg-red-100",
    marker: "fill-red-500 stroke-white",
  },
  UNAVAILABLE: {
    label: "Unavailable",
    dot: "bg-slate-400",
    lot: "border-slate-200 bg-slate-100 text-slate-500 hover:border-slate-400 hover:bg-slate-200",
    marker: "fill-slate-400 stroke-white",
  },
};

function parseLandedSitePlan(value: unknown): LandedSitePlan | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const sitePlan = (value as { sitePlan?: unknown }).sitePlan;
  if (!sitePlan || typeof sitePlan !== "object" || Array.isArray(sitePlan))
    return null;

  const rawPlan = sitePlan as Record<string, unknown>;
  if (
    typeof rawPlan.zoneCode !== "string" ||
    typeof rawPlan.title !== "string" ||
    !Array.isArray(rawPlan.tabs)
  ) {
    return null;
  }

  const tabs = rawPlan.tabs.flatMap((tab): SitePlanTab[] => {
    if (!tab || typeof tab !== "object" || Array.isArray(tab)) return [];
    const rawTab = tab as Record<string, unknown>;
    if (
      typeof rawTab.code !== "string" ||
      typeof rawTab.label !== "string" ||
      !Array.isArray(rawTab.layoutCodes) ||
      !rawTab.layoutCodes.every((code) => typeof code === "string")
    ) {
      return [];
    }

    return [
      {
        code: rawTab.code,
        label: rawTab.label,
        layoutCodes: rawTab.layoutCodes,
      },
    ];
  });

  const maps = Array.isArray(rawPlan.maps)
    ? rawPlan.maps.flatMap((map): SitePlanMap[] => {
        if (!map || typeof map !== "object" || Array.isArray(map)) return [];
        const rawMap = map as Record<string, unknown>;
        if (
          typeof rawMap.tabCode !== "string" ||
          typeof rawMap.markerRadius !== "number" ||
          typeof rawMap.hitRadius !== "number" ||
          !Array.isArray(rawMap.lots)
        ) {
          return [];
        }

        const lots = rawMap.lots.flatMap((lot): SitePlanLot[] => {
          if (!lot || typeof lot !== "object" || Array.isArray(lot)) return [];
          const rawLot = lot as Record<string, unknown>;
          return typeof rawLot.unitNo === "string" &&
            typeof rawLot.xNorm === "number" &&
            typeof rawLot.yNorm === "number"
            ? [
                {
                  unitNo: rawLot.unitNo,
                  xNorm: rawLot.xNorm,
                  yNorm: rawLot.yNorm,
                },
              ]
            : [];
        });

        return lots.length > 0
          ? [
              {
                tabCode: rawMap.tabCode,
                markerRadius: rawMap.markerRadius,
                hitRadius: rawMap.hitRadius,
                lots,
              },
            ]
          : [];
      })
    : [];

  const rowGroups = Array.isArray(rawPlan.rowGroups)
    ? rawPlan.rowGroups.flatMap((group): SitePlanRowGroup[] => {
        if (!group || typeof group !== "object" || Array.isArray(group))
          return [];
        const rawGroup = group as Record<string, unknown>;
        if (
          typeof rawGroup.code !== "string" ||
          typeof rawGroup.label !== "string" ||
          !Array.isArray(rawGroup.rows)
        )
          return [];
        const rows = rawGroup.rows.flatMap((row): string[][] =>
          Array.isArray(row) &&
          row.length > 0 &&
          row.length <= 30 &&
          row.every((unitNo) => typeof unitNo === "string")
            ? [row]
            : [],
        );
        return rows.length > 0
          ? [{ code: rawGroup.code, label: rawGroup.label, rows }]
          : [];
      })
    : [];

  return tabs.length > 0
    ? {
        zoneCode: rawPlan.zoneCode,
        title: rawPlan.title,
        tabs,
        maps,
        rowGroups,
      }
    : null;
}

export function hasLandedSitePlan(
  availabilityPlans: AvailabilityPlanDocument[],
) {
  return availabilityPlans.some(
    (availabilityPlan) => parseLandedSitePlan(availabilityPlan.plan) !== null,
  );
}

function getStatus(statusCode: string | null): DisplayStatus {
  if (statusCode === "AVAILABLE") return "AVAILABLE";
  if (
    [
      "BOOKED",
      "BOOKING",
      "RESERVED",
      "SOLD",
      "SPA_SIGNED",
      "APPROVED",
    ].includes(statusCode ?? "")
  ) {
    return "BOOKED";
  }
  return "UNAVAILABLE";
}

function formatMoney(value: string | null) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0
    ? `RM ${amount.toLocaleString("en-MY", { maximumFractionDigits: 0 })}`
    : "Price on request";
}

function formatNumber(value: string | null) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0
    ? amount.toLocaleString("en-MY", { maximumFractionDigits: 0 })
    : "-";
}

function splitLotsByRowBreaks(lots: SitePlanLot[], rowCount: number) {
  const rows = Array.from({ length: rowCount }, () => [] as SitePlanLot[]);

  if (rowCount <= 0 || lots.length === 0) {
    return rows;
  }

  if (lots.length <= rowCount) {
    return lots
      .map((lot) => [lot])
      .concat(Array.from({ length: rowCount - lots.length }, () => []));
  }

  const gaps = lots.slice(1).map((lot, index) => ({
    index,
    gap: Math.abs(lot.yNorm - lots[index].yNorm),
  }));
  const breakIndexes = gaps
    .sort((a, b) => b.gap - a.gap)
    .slice(0, Math.max(0, rowCount - 1))
    .map((entry) => entry.index + 1)
    .sort((a, b) => a - b);

  let start = 0;
  const parsedRows: SitePlanLot[][] = [];

  for (const breakIndex of breakIndexes) {
    parsedRows.push(lots.slice(start, breakIndex));
    start = breakIndex;
  }
  parsedRows.push(lots.slice(start));

  while (parsedRows.length < rowCount) {
    parsedRows.push([]);
  }

  return parsedRows.slice(0, rowCount);
}

function splitLotsByJumpThreshold(
  lots: SitePlanLot[],
  minRows: number,
  maxRows: number,
  jumpMultiplier: number,
) {
  if (lots.length === 0) {
    return [] as SitePlanLot[][];
  }

  if (lots.length === 1) {
    return [[lots[0]]];
  }

  const gaps = lots.slice(1).map((lot, index) => ({
    index,
    gap: Math.abs(lot.yNorm - lots[index].yNorm),
  }));
  const sortedGaps = [...gaps].map((entry) => entry.gap).sort((a, b) => a - b);
  const medianGap = sortedGaps[Math.floor(sortedGaps.length / 2)] ?? 0;

  if (medianGap <= 0) {
    return splitLotsByRowBreaks(lots, minRows);
  }

  const breakIndexes = gaps
    .filter((entry) => entry.gap > medianGap * jumpMultiplier)
    .map((entry) => entry.index + 1)
    .sort((a, b) => a - b);

  let rows = breakIndexes.length + 1;
  if (rows < minRows) {
    return splitLotsByRowBreaks(lots, minRows);
  }
  if (rows > maxRows) {
    return splitLotsByRowBreaks(lots, maxRows);
  }

  const parsedRows: SitePlanLot[][] = [];
  let start = 0;

  for (const breakIndex of breakIndexes) {
    parsedRows.push(lots.slice(start, breakIndex));
    start = breakIndex;
  }
  parsedRows.push(lots.slice(start));

  return parsedRows;
}

function pair22x70Rows(rows: SitePlanLot[][]) {
  if (rows.length !== 10) {
    return rows;
  }

  const pairedTopRows: SitePlanLot[][] = [];

  for (let index = 0; index < 3; index += 1) {
    const leftRow = rows[index] ?? [];
    const rightRow = rows[index + 3] ?? [];
    const combined = [...leftRow, ...rightRow].sort(
      (a, b) => a.xNorm - b.xNorm,
    );
    pairedTopRows.push(combined);
  }

  return [
    ...pairedTopRows,
    rows[6] ?? [],
    rows[7] ?? [],
    rows[8] ?? [],
    rows[9] ?? [],
  ];
}

export function PublicLandedAvailability({
  projectName,
  units,
  layouts,
  availabilityPlans,
}: {
  projectName: string;
  units: LandedUnit[];
  layouts: Layout[];
  availabilityPlans: AvailabilityPlanDocument[];
}) {
  const sitePlan = availabilityPlans
    .map((availabilityPlan) => parseLandedSitePlan(availabilityPlan.plan))
    .find((plan): plan is LandedSitePlan => plan !== null);
  const layoutById = new Map(layouts.map((layout) => [layout.id, layout]));
  const [activeTabCode, setActiveTabCode] = useState(
    sitePlan?.tabs[0]?.code ?? "",
  );
  const [statusFilter, setStatusFilter] = useState<"ALL" | DisplayStatus>(
    "ALL",
  );
  const [lotTypeFilter, setLotTypeFilter] = useState("ALL");
  const [positionFilter, setPositionFilter] = useState("ALL");
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  if (!sitePlan) return null;

  const activeTab =
    sitePlan.tabs.find((tab) => tab.code === activeTabCode) ?? sitePlan.tabs[0];
  const tabUnits = units.filter((unit) => {
    const layoutCode = unit.layoutId
      ? layoutById.get(unit.layoutId)?.code
      : null;
    return (
      layoutCode !== null &&
      layoutCode !== undefined &&
      activeTab.layoutCodes.includes(layoutCode)
    );
  });
  const filteredUnits = tabUnits.filter((unit) => {
    const statusMatches =
      statusFilter === "ALL" ||
      getStatus(unit.bookingStatusCode) === statusFilter;
    const lotTypeMatches =
      lotTypeFilter === "ALL" || unit.lotTypeName === lotTypeFilter;
    const positionMatches =
      positionFilter === "ALL" || unit.positionTypeName === positionFilter;
    return statusMatches && lotTypeMatches && positionMatches;
  });
  const selectedUnit =
    tabUnits.find((unit) => unit.id === selectedUnitId) ?? null;
  const selectedLayout = selectedUnit?.layoutId
    ? (layoutById.get(selectedUnit.layoutId) ?? null)
    : null;
  const activeMap =
    sitePlan.maps.find((map) => map.tabCode === activeTab.code) ?? null;
  const availableCount = tabUnits.filter(
    (unit) => getStatus(unit.bookingStatusCode) === "AVAILABLE",
  ).length;
  const bookedCount = tabUnits.filter(
    (unit) => getStatus(unit.bookingStatusCode) === "BOOKED",
  ).length;
  const lotTypes = [
    ...new Set(
      tabUnits
        .map((unit) => unit.lotTypeName)
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort();
  const positions = [
    ...new Set(
      tabUnits
        .map((unit) => unit.positionTypeName)
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort();
  const tabUnitsByNo = new Map(tabUnits.map((unit) => [unit.unitNo, unit]));
  const filteredUnitNos = new Set(filteredUnits.map((unit) => unit.unitNo));
  const tabLotsInMapOrder =
    activeMap?.lots.filter((lot) => tabUnitsByNo.has(lot.unitNo)) ?? [];
  const rowLots =
    activeTab.code === "22X70"
      ? pair22x70Rows(splitLotsByJumpThreshold(tabLotsInMapOrder, 5, 10, 6))
      : splitLotsByRowBreaks(tabLotsInMapOrder, 5);
  const unitRows = rowLots.map((rowLotsList) =>
    rowLotsList
      .filter((lot) => filteredUnitNos.has(lot.unitNo))
      .flatMap((lot) => {
        const unit = tabUnitsByNo.get(lot.unitNo);
        return unit ? [unit] : [];
      }),
  );
  const configuredRowGroups =
    sitePlan.rowGroups.length > 0
      ? sitePlan.rowGroups.map((group) => ({
          ...group,
          rows: group.rows.map((row) =>
            row.flatMap((unitNo) => {
              const unit = tabUnitsByNo.get(unitNo);
              return unit ? [unit] : [];
            }),
          ),
        }))
      : [];
  const stackRowGroups =
    sitePlan.zoneCode === "ELORA 2A" || sitePlan.zoneCode === "AVENIA L4(A)(I)";
  const longestConfiguredRow = Math.max(
    0,
    ...configuredRowGroups.flatMap((group) =>
      group.rows.map((row) => row.length),
    ),
  );
  const useWidePlanLayout = longestConfiguredRow >= 17;

  function selectTab(code: string) {
    setActiveTabCode(code);
    setSelectedUnitId(null);
    setStatusFilter("ALL");
    setLotTypeFilter("ALL");
    setPositionFilter("ALL");
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#eff4f1] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[96rem]">
        <header className="border-b border-emerald-950/10 pb-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">
            Live landed availability
          </p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">
                {projectName} site plan
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-600">
                {sitePlan.title} · Zone {sitePlan.zoneCode}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-slate-700">
              <span className="inline-flex items-center gap-2">
                <span className="size-3 rounded-full bg-blue-600" />
                {availableCount} available
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-3 rounded-full bg-red-500" />
                {bookedCount} booked / sold
              </span>
              <span>{tabUnits.length} total lots</span>
            </div>
          </div>
        </header>

        <div
          className={`mt-6 grid gap-6 ${useWidePlanLayout ? "2xl:grid-cols-[minmax(0,1fr)_22rem]" : "xl:grid-cols-[minmax(0,1fr)_22rem]"}`}
        >
          <div className="space-y-5">
            <section className="border border-emerald-950/10 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex w-full border border-slate-200 p-1 lg:w-auto">
                  {sitePlan.tabs.map((tab) => (
                    <button
                      key={tab.code}
                      type="button"
                      onClick={() => selectTab(tab.code)}
                      className={`min-w-32 px-4 py-2 text-sm font-black transition ${tab.code === activeTab.code ? "bg-emerald-700 text-white" : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-900"}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <p className="text-sm font-medium text-slate-600">
                  Select a lot to view its live pricing and availability.
                </p>
              </div>
              <div className="grid gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:grid-cols-3">
                <label className="relative block">
                  <span className="sr-only">Filter availability</span>
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value as "ALL" | DisplayStatus,
                      )
                    }
                    className="h-10 w-full appearance-none border border-slate-200 bg-white px-3 pr-9 text-sm font-bold text-slate-800 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="ALL">All availability</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="BOOKED">Booked / Sold</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-slate-500" />
                </label>
                <label className="relative block">
                  <span className="sr-only">Filter lot type</span>
                  <select
                    value={lotTypeFilter}
                    onChange={(event) => setLotTypeFilter(event.target.value)}
                    className="h-10 w-full appearance-none border border-slate-200 bg-white px-3 pr-9 text-sm font-bold text-slate-800 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="ALL">All lot types</option>
                    {lotTypes.map((lotType) => (
                      <option key={lotType} value={lotType}>
                        {lotType}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-slate-500" />
                </label>
                <label className="relative block">
                  <span className="sr-only">Filter lot position</span>
                  <select
                    value={positionFilter}
                    onChange={(event) => setPositionFilter(event.target.value)}
                    className="h-10 w-full appearance-none border border-slate-200 bg-white px-3 pr-9 text-sm font-bold text-slate-800 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="ALL">All lot positions</option>
                    {positions.map((position) => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-slate-500" />
                </label>
              </div>
              <div className="overflow-auto p-5">
                <div
                  className={`${useWidePlanLayout ? "min-w-[72rem]" : "min-w-[48rem]"} rounded border-[14px] border-emerald-100 bg-[#e8f2e8] p-5 shadow-inner`}
                >
                  <div className="flex items-center justify-between border-b-[10px] border-slate-300 pb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    <span>Zone {sitePlan.zoneCode} access road</span>
                    <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
                      <Compass className="size-3" />
                      North
                    </span>
                  </div>
                  <div
                    className={
                      configuredRowGroups.length > 0
                        ? `mt-5 grid gap-4 ${stackRowGroups || configuredRowGroups.length === 1 ? "grid-cols-1" : configuredRowGroups.length === 2 ? "grid-cols-2" : "grid-cols-5"}`
                        : "mt-5 space-y-3"
                    }
                  >
                    {configuredRowGroups.length > 0
                      ? configuredRowGroups.map((group) => (
                          <section
                            key={group.code}
                            className="border border-emerald-950/15 bg-white p-2 shadow-sm"
                          >
                            <div className="mb-2 border-b border-slate-100 pb-2 text-center text-[0.6rem] font-black uppercase tracking-[0.14em] text-slate-500">
                              {group.label}
                            </div>
                            <div className="space-y-1">
                              {group.rows.map((row, rowIndex) => (
                                <div
                                  key={`${group.code}-${rowIndex}`}
                                  className="grid gap-1"
                                  style={{
                                    gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))`,
                                  }}
                                >
                                  {row.map((unit) => {
                                    const status = getStatus(
                                      unit.bookingStatusCode,
                                    );
                                    const isSelected =
                                      selectedUnitId === unit.id;
                                    const matchesFilter = filteredUnitNos.has(
                                      unit.unitNo,
                                    );
                                    return (
                                      <button
                                        key={unit.id}
                                        type="button"
                                        onClick={() =>
                                          setSelectedUnitId(unit.id)
                                        }
                                        title={`${unit.unitNo} · ${statusStyle[status].label}`}
                                        aria-label={`${unit.unitNo}, ${statusStyle[status].label}`}
                                        className={`relative flex h-12 items-end justify-center border px-1 pb-1 text-center text-[0.6rem] font-black leading-tight transition focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-1 ${statusStyle[status].lot} ${isSelected ? "ring-2 ring-slate-950 ring-offset-1" : ""} ${matchesFilter ? "" : "opacity-25"}`}
                                      >
                                        <span
                                          className={`absolute right-1 top-1 size-2 rounded-full ${statusStyle[status].dot}`}
                                        />
                                        <span>{unit.unitNo}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          </section>
                        ))
                      : unitRows.map((row, rowIndex) => (
                          <section
                            key={`row-${rowIndex}`}
                            className="border border-emerald-950/15 bg-white p-3 shadow-sm"
                          >
                            <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2 text-[0.65rem] font-black uppercase tracking-[0.16em] text-slate-500">
                              <span>Residential row {rowIndex + 1}</span>
                              <span>{row.length} lots</span>
                            </div>
                            <div className="flex gap-1 overflow-x-auto pb-1">
                              {row.map((unit) => {
                                const status = getStatus(
                                  unit.bookingStatusCode,
                                );
                                const isSelected = selectedUnitId === unit.id;

                                return (
                                  <button
                                    key={unit.id}
                                    type="button"
                                    onClick={() => setSelectedUnitId(unit.id)}
                                    title={`${unit.unitNo} · ${statusStyle[status].label}`}
                                    aria-label={`${unit.unitNo}, ${statusStyle[status].label}`}
                                    className={`relative flex h-20 w-8 min-w-8 items-center justify-center border px-0.5 py-1 text-[0.55rem] font-black leading-none transition focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-1 ${statusStyle[status].lot} ${isSelected ? "ring-2 ring-slate-950 ring-offset-1" : ""}`}
                                  >
                                    <span
                                      className={`absolute right-0.5 top-0.5 size-2 rounded-full ${statusStyle[status].dot}`}
                                    />
                                    <span className="max-h-full overflow-hidden [text-orientation:mixed] [writing-mode:vertical-rl]">
                                      {unit.unitNo.replace("PTD ", "")}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </section>
                        ))}
                  </div>
                  {filteredUnits.length === 0 ? (
                    <p className="py-16 text-center text-sm font-bold text-slate-500">
                      No lots match the selected filters.
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="border-t border-slate-100 px-5 py-3 text-xs font-medium text-slate-500">
                This is a live, schematic Zone {sitePlan.zoneCode} plan. Select
                a lot to inspect its live availability and pricing.
              </div>
            </section>
          </div>

          <aside className="border border-emerald-950/10 bg-white p-6 shadow-sm xl:sticky xl:top-6 xl:self-start">
            {selectedUnit ? (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                      Selected lot
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">
                      {selectedUnit.unitNo}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedUnitId(null)}
                    className="grid size-9 place-items-center border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                    aria-label="Close selected lot"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <span
                  className={`mt-5 inline-flex items-center gap-2 border px-3 py-1.5 text-xs font-black ${statusStyle[getStatus(selectedUnit.bookingStatusCode)].lot}`}
                >
                  <span
                    className={`size-2 rounded-full ${statusStyle[getStatus(selectedUnit.bookingStatusCode)].dot}`}
                  />
                  {selectedUnit.bookingStatusName ??
                    statusStyle[getStatus(selectedUnit.bookingStatusCode)]
                      .label}
                </span>
                <div className="mt-7 space-y-4 border-y border-slate-100 py-5 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Type</span>
                    <span className="text-right font-black text-slate-950">
                      {selectedLayout?.name ?? selectedLayout?.code ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Lot position</span>
                    <span className="font-black text-slate-950">
                      {selectedUnit.positionTypeName ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Eligibility</span>
                    <span className="font-black text-slate-950">
                      {selectedUnit.lotTypeName ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Facing</span>
                    <span className="inline-flex items-center gap-1 font-black text-slate-950">
                      <Compass className="size-3 text-emerald-700" />
                      {selectedUnit.facingTypeName ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Land area</span>
                    <span className="font-black text-slate-950">
                      {formatNumber(selectedUnit.landAreaSqft)} sqft
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Built-up</span>
                    <span className="font-black text-slate-950">
                      {formatNumber(selectedUnit.builtUpSqft)} sqft
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Bedrooms / baths</span>
                    <span className="font-black text-slate-950">
                      {selectedLayout
                        ? `${selectedLayout.bedrooms} / ${selectedLayout.bathrooms}`
                        : "-"}
                    </span>
                  </div>
                </div>
                <p className="mt-5 text-2xl font-black text-slate-950">
                  {formatMoney(
                    selectedUnit.finalPrice ?? selectedUnit.basePrice,
                  )}
                </p>
                <a
                  href={getPublicWhatsAppHref(
                    `Hi, I am interested in ${projectName}, ${selectedUnit.unitNo}. Please share the latest availability and booking details.`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 bg-emerald-700 px-4 text-sm font-black text-white transition hover:bg-emerald-800"
                >
                  <MessageCircle className="size-4" />
                  Enquire about this lot
                </a>
              </div>
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center text-center">
                <span className="grid size-12 place-items-center border border-emerald-200 bg-emerald-50 text-emerald-700">
                  <MapPin className="size-5" />
                </span>
                <h2 className="mt-4 font-black text-slate-950">Select a lot</h2>
                <p className="mt-2 max-w-56 text-sm leading-6 text-slate-500">
                  Choose any marked lot to see its live eligibility, dimensions,
                  price, and booking status.
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Ruler className="size-3" />
                  {activeTab.label}
                </span>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
