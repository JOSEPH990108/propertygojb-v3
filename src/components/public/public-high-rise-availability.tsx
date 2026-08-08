"use client";

import { useState } from "react";
import { Building2, ChevronDown, CircleDollarSign, Compass, Ruler, X } from "lucide-react";

type AvailabilityUnit = {
  id: string;
  unitNo: string;
  layoutId: string | null;
  basePrice: string;
  finalPrice: string | null;
  builtUpSqft: string | null;
  floor: number | null;
  stack: string | null;
  facing: string | null;
  positionTypeName: string | null;
  bookingStatusCode: string | null;
  bookingStatusName: string | null;
};

type Layout = { id: string; code: string; name: string | null };
type UnitStatus = "AVAILABLE" | "BOOKING" | "SOLD" | "UNVERIFIED" | "OTHER";
type AvailabilityPlanDocument = { towerCode: string; plan: unknown };
type ServiceBlock = { label: string; stacks: string[] };
type FloorOverride = { mergedFootprints?: string[][]; serviceBlocks?: ServiceBlock[]; unitStackToPhysicalStack?: Record<string, string> };
type TowerPlan = { physicalStacks?: string[]; viewGroups?: string[][]; floorOverrides?: Record<string, FloorOverride> };

const statusStyles: Record<UnitStatus, { label: string; cell: string; swatch: string }> = {
  AVAILABLE: { label: "Available", cell: "border-emerald-300 bg-emerald-100 text-emerald-950 hover:bg-emerald-200", swatch: "bg-emerald-400" },
  BOOKING: { label: "Booking", cell: "border-amber-300 bg-amber-100 text-amber-950 hover:bg-amber-200", swatch: "bg-amber-400" },
  SOLD: { label: "Sold", cell: "border-slate-200 bg-slate-200 text-slate-400", swatch: "bg-slate-300" },
  UNVERIFIED: { label: "Availability pending", cell: "border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200", swatch: "bg-slate-400" },
  OTHER: { label: "Unavailable", cell: "border-slate-200 bg-slate-50 text-slate-400", swatch: "bg-slate-200" },
};

function getUnitStatus(statusCode: string | null): UnitStatus {
  if (statusCode === "AVAILABLE") return "AVAILABLE";
  if (statusCode === "BOOKING" || statusCode === "RESERVED") return "BOOKING";
  if (statusCode === "SOLD") return "SOLD";
  if (statusCode === "UNVERIFIED") return "UNVERIFIED";
  return "OTHER";
}

function getTower(unitNo: string) {
  return unitNo.split("-")[0] ?? "";
}

function formatMoney(value: string | null) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? `RM ${amount.toLocaleString("en-MY", { maximumFractionDigits: 0 })}` : "Price on request";
}

function parseTowerPlan(value: unknown): TowerPlan | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const plan = value as Record<string, unknown>;
  const physicalStacks = Array.isArray(plan.physicalStacks) && plan.physicalStacks.every((stack) => typeof stack === "string")
    ? plan.physicalStacks
    : undefined;
  const viewGroups = Array.isArray(plan.viewGroups) && plan.viewGroups.every((group) => Array.isArray(group) && group.every((stack) => typeof stack === "string"))
    ? plan.viewGroups as string[][]
    : undefined;
  const rawOverrides = plan.floorOverrides;
  const floorOverrides: Record<string, FloorOverride> = {};

  if (rawOverrides && typeof rawOverrides === "object" && !Array.isArray(rawOverrides)) {
    for (const [floor, rawOverride] of Object.entries(rawOverrides)) {
      if (!rawOverride || typeof rawOverride !== "object" || Array.isArray(rawOverride)) continue;
      const override = rawOverride as Record<string, unknown>;
      const mergedFootprints = Array.isArray(override.mergedFootprints) && override.mergedFootprints.every((group) => Array.isArray(group) && group.every((stack) => typeof stack === "string"))
        ? override.mergedFootprints as string[][]
        : undefined;
      const serviceBlocks = Array.isArray(override.serviceBlocks)
        ? override.serviceBlocks.filter((block): block is ServiceBlock => Boolean(block && typeof block === "object" && "label" in block && "stacks" in block && typeof block.label === "string" && Array.isArray(block.stacks) && block.stacks.every((stack: unknown) => typeof stack === "string")))
        : undefined;
      const rawUnitStackToPhysicalStack = override.unitStackToPhysicalStack;
      const unitStackToPhysicalStack = rawUnitStackToPhysicalStack && typeof rawUnitStackToPhysicalStack === "object" && !Array.isArray(rawUnitStackToPhysicalStack)
        ? Object.fromEntries(Object.entries(rawUnitStackToPhysicalStack).filter(([, stack]) => typeof stack === "string"))
        : undefined;
      floorOverrides[floor] = { mergedFootprints, serviceBlocks, unitStackToPhysicalStack };
    }
  }

  return { physicalStacks, viewGroups, floorOverrides };
}

export function PublicHighRiseAvailability({ projectName, units, layouts, availabilityPlans = [] }: { projectName: string; units: AvailabilityUnit[]; layouts: Layout[]; availabilityPlans?: AvailabilityPlanDocument[] }) {
  const mappedUnits = units.filter((unit) => unit.floor !== null && unit.stack && getTower(unit.unitNo));
  const towers = [...new Set(mappedUnits.map((unit) => getTower(unit.unitNo)))].sort();
  const [activeTower, setActiveTower] = useState(towers[0] ?? "");
  const towerUnits = mappedUnits.filter((unit) => getTower(unit.unitNo) === activeTower);
  const floors = [...new Set(towerUnits.map((unit) => unit.floor as number))].sort((a, b) => b - a);
  const actualStacks = [...new Set(towerUnits.map((unit) => unit.stack as string))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const activePlan = parseTowerPlan(availabilityPlans.find((plan) => plan.towerCode === activeTower)?.plan);
  const physicalStacks = activePlan?.physicalStacks?.length ? activePlan.physicalStacks : actualStacks;
  const [selectedFloor, setSelectedFloor] = useState<number | null>(floors[0] ?? null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const activeFloor = selectedFloor !== null && floors.includes(selectedFloor) ? selectedFloor : floors[0] ?? null;
  const unitsByPosition = new Map(towerUnits.map((unit) => {
    const physicalStack = activePlan?.floorOverrides?.[String(unit.floor)]?.unitStackToPhysicalStack?.[unit.stack as string] ?? unit.stack;
    return [`${unit.floor}-${physicalStack}`, unit];
  }));
  const selectedUnit = towerUnits.find((unit) => unit.id === selectedUnitId) ?? null;
  const selectedLayout = layouts.find((layout) => layout.id === selectedUnit?.layoutId) ?? null;
  const stackMetadata = new Map(actualStacks.map((stack) => [stack, towerUnits.find((unit) => unit.stack === stack)]));
  const counts = towerUnits.reduce<Record<UnitStatus, number>>((total, unit) => {
    total[getUnitStatus(unit.bookingStatusCode)] += 1;
    return total;
  }, { AVAILABLE: 0, BOOKING: 0, SOLD: 0, UNVERIFIED: 0, OTHER: 0 });
  const focusColumns = `5rem repeat(${physicalStacks.length}, minmax(0, 1fr))`;
  const elevationColumns = focusColumns;

  function selectTower(tower: string) {
    const towerFloors = [...new Set(mappedUnits.filter((unit) => getTower(unit.unitNo) === tower).map((unit) => unit.floor as number))].sort((a, b) => b - a);
    setActiveTower(tower);
    setSelectedFloor(towerFloors[0] ?? null);
    setSelectedUnitId(null);
  }

  function selectUnit(unit: AvailabilityUnit) {
    setSelectedFloor(unit.floor);
    setSelectedUnitId(unit.id);
  }

  function formatFacing(facing: string | null) {
    if (facing === "NORTHWEST") return "Lake, Golf & City View";
    if (facing === "SOUTHEAST") return "Singapore View";
    if (facing === "NORTHEAST") return "Facilities View";
    if (facing === "SOUTHWEST") return "Lake, Golf & City View";
    return facing?.replaceAll("_", " ") ?? "-";
  }

  function getViewLabel(unit: AvailabilityUnit | null | undefined) {
    return unit?.positionTypeName ?? formatFacing(unit?.facing ?? null);
  }

  function renderMetadataCells(kind: "facing" | "type" | "bua" | "unit", metadataFloor = activeFloor, allowStackFallback = true) {
    const rowClass = kind === "facing"
      ? "min-h-10 border-b border-r border-slate-200 px-2 text-center text-[0.65rem] font-black leading-tight text-slate-700"
      : kind === "type"
        ? "min-h-9 border-b border-r border-slate-200 px-2 text-center text-xs font-black text-slate-950"
        : kind === "bua"
          ? "min-h-9 border-b border-r border-slate-200 px-2 text-center text-xs font-bold text-slate-600"
          : "min-h-9 border-r border-slate-200 px-2 text-center text-xs font-black text-slate-700";

    const floorOverride = activePlan?.floorOverrides?.[String(metadataFloor)];
    const floorUnits = towerUnits.filter((unit) => unit.floor === metadataFloor).sort((first, second) => (first.stack ?? "").localeCompare(second.stack ?? "", undefined, { numeric: true }));

    if (floorOverride?.mergedFootprints?.length) {
      return floorUnits.map((unit, index) => {
        const layout = layouts.find((item) => item.id === unit.layoutId);
        const value = kind === "facing" ? getViewLabel(unit) : kind === "type" ? layout?.code ?? "-" : kind === "bua" ? unit.builtUpSqft ? `${unit.builtUpSqft} sqft` : "-" : unit.stack;
        return <div key={`${kind}-${unit.id}`} className={`flex items-center justify-center ${rowClass}`} style={{ gridColumn: `span ${floorOverride.mergedFootprints?.[index].length ?? 1}` }}>{value}</div>;
      });
    }

    const serviceBlockByFirstStack = new Map((floorOverride?.serviceBlocks ?? []).map((block) => [block.stacks[0], block]));
    const serviceStacks = new Set((floorOverride?.serviceBlocks ?? []).flatMap((block) => block.stacks));

    if (kind === "facing" && !serviceStacks.size) {
      const viewGroups = activePlan?.viewGroups?.length
        ? activePlan.viewGroups
        : physicalStacks.reduce<string[][]>((groups, stack) => {
            const unit = unitsByPosition.get(`${metadataFloor}-${stack}`) ?? stackMetadata.get(stack);
            const viewLabel = getViewLabel(unit);
            const previousGroup = groups.at(-1);
            const previousUnit = previousGroup
              ? unitsByPosition.get(`${metadataFloor}-${previousGroup[0]}`) ?? stackMetadata.get(previousGroup[0])
              : null;

            if (previousGroup && getViewLabel(previousUnit) === viewLabel) {
              previousGroup.push(stack);
            } else {
              groups.push([stack]);
            }

            return groups;
          }, []);

      return viewGroups.map((group) => {
        const unit = unitsByPosition.get(`${metadataFloor}-${group[0]}`) ?? stackMetadata.get(group[0]);
        return <div key={`${kind}-${group[0]}`} className={`flex items-center justify-center ${rowClass}`} style={{ gridColumn: `span ${group.length}` }}>{getViewLabel(unit)}</div>;
      });
    }

    return physicalStacks.map((stack) => {
      const serviceBlock = serviceBlockByFirstStack.get(stack);
      if (serviceBlock) return <div key={`${kind}-service-${stack}`} className={`flex items-center justify-center bg-slate-200 text-slate-700 ${rowClass}`} style={{ gridColumn: `span ${serviceBlock.stacks.length}` }}>{kind === "unit" ? serviceBlock.label : "Service"}</div>;
      if (serviceStacks.has(stack)) return null;
      const unit = unitsByPosition.get(`${metadataFloor}-${stack}`) ?? (allowStackFallback ? stackMetadata.get(stack) : null);
      const layout = unit ? layouts.find((item) => item.id === unit.layoutId) : null;
      const value = kind === "facing" ? getViewLabel(unit) : kind === "type" ? layout?.code ?? "-" : kind === "bua" ? unit?.builtUpSqft ? `${unit.builtUpSqft} sqft` : "-" : stack;
      return <div key={`${kind}-${stack}`} className={`flex items-center justify-center ${rowClass}`}>{value}</div>;
    });
  }

  function renderTypeExceptionRow(floor: number) {
    return <div className="mb-1 grid border-y border-slate-200" style={{ gridTemplateColumns: focusColumns }}>
      <div className="flex min-h-9 items-center justify-center border-r border-slate-200 bg-slate-100 px-3 text-xs font-black text-slate-600">Type</div>
      {renderMetadataCells("type", floor, false)}
    </div>;
  }

  function renderElevationCell(floor: number, stack: string) {
    const unit = unitsByPosition.get(`${floor}-${stack}`);
    const isCore = !stackMetadata.has(stack);

    if (!unit) {
      return <div key={stack} title={isCore ? "Core / service position" : "No saleable unit on this floor"} className={`h-7 border ${isCore ? "border-slate-300 bg-slate-300/80" : "border-dashed border-slate-100 bg-slate-50/70"}`} />;
    }

    const status = getUnitStatus(unit.bookingStatusCode);
    const layout = layouts.find((item) => item.id === unit.layoutId);
    return <button key={unit.id} type="button" onClick={() => selectUnit(unit)} title={`${unit.unitNo} · ${layout?.code ?? "Unit"} · ${unit.facing ?? "Facing unavailable"} · ${statusStyles[status].label}`} aria-label={`${unit.unitNo}, ${statusStyles[status].label}`} className={`flex h-7 items-center justify-center overflow-hidden border px-0.5 text-[0.55rem] font-black leading-none transition focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 ${statusStyles[status].cell} ${floor === activeFloor ? "ring-1 ring-blue-500" : ""} ${selectedUnitId === unit.id ? "ring-2 ring-slate-950 ring-offset-1" : ""}`}><span className="whitespace-nowrap">{unit.unitNo}</span></button>;
  }

  function renderElevationRow(floor: number) {
    const floorUnits = towerUnits.filter((unit) => unit.floor === floor).sort((first, second) => (first.stack ?? "").localeCompare(second.stack ?? "", undefined, { numeric: true }));
    const floorOverride = activePlan?.floorOverrides?.[String(floor)];
    const mergedFootprints = floorOverride?.mergedFootprints ?? [];

    if (mergedFootprints.length > 0) {
      return mergedFootprints.map((footprint, index) => {
        const unit = floorUnits[index];
        if (!unit) return <div key={`merged-${index}`} className="h-7 border border-dashed border-slate-100 bg-slate-50/70" style={{ gridColumn: `span ${footprint.length}` }} />;
        const status = getUnitStatus(unit.bookingStatusCode);
        const layout = layouts.find((item) => item.id === unit.layoutId);
        return <button key={unit.id} type="button" onClick={() => selectUnit(unit)} title={`${unit.unitNo} · ${layout?.code ?? "Unit"} · ${unit.facing ?? "Facing unavailable"} · ${statusStyles[status].label}`} aria-label={`${unit.unitNo}, ${statusStyles[status].label}`} className={`flex h-7 items-center justify-center border px-1 text-[0.6rem] font-black transition focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 ${statusStyles[status].cell} ${floor === activeFloor ? "ring-1 ring-blue-500" : ""} ${selectedUnitId === unit.id ? "ring-2 ring-slate-950 ring-offset-1" : ""}`} style={{ gridColumn: `span ${footprint.length}` }}><span>{unit.unitNo}</span></button>;
      });
    }

    const serviceBlockByFirstStack = new Map((floorOverride?.serviceBlocks ?? []).map((block) => [block.stacks[0], block]));
    const serviceStacks = new Set((floorOverride?.serviceBlocks ?? []).flatMap((block) => block.stacks));
    return physicalStacks.map((stack) => {
      const serviceBlock = serviceBlockByFirstStack.get(stack);
      if (serviceBlock) return <div key={`service-${stack}`} className="flex h-7 items-center justify-center border border-slate-400 bg-slate-300 px-1 text-[0.6rem] font-black tracking-wide text-slate-700" style={{ gridColumn: `span ${serviceBlock.stacks.length}` }}>{serviceBlock.label}</div>;
      if (serviceStacks.has(stack)) return null;
      return renderElevationCell(floor, stack);
    });
  }

  if (towerUnits.length === 0 || activeFloor === null) return null;

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#edf2f8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[96rem]">
        <section className="border-b border-slate-200 pb-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div><p className="text-xs font-black uppercase tracking-[0.24em] text-blue-700">Live unit availability</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{projectName} towers</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Tower plans preserve physical core positions while displaying only the current sellable inventory.</p></div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-slate-600">{(["AVAILABLE", "BOOKING", "SOLD", "UNVERIFIED"] as UnitStatus[]).filter((status) => counts[status] > 0).map((status) => <span key={status} className="inline-flex items-center gap-2"><span className={`size-3 rounded-full ${statusStyles[status].swatch}`} />{counts[status]} {statusStyles[status].label.toLowerCase()}</span>)}</div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            <section className="border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center bg-blue-600 text-white"><Building2 className="size-4" /></span><div><p className="font-black text-slate-950">Tower plan</p><p className="text-xs font-bold text-slate-500">{floors.length} floors · {actualStacks.length} sellable stacks · {physicalStacks.length} plan positions</p></div></div><div className="flex w-full border border-slate-200 p-1 sm:w-auto">{towers.map((tower) => <button key={tower} type="button" onClick={() => selectTower(tower)} className={`min-w-24 px-4 py-2 text-sm font-black transition ${tower === activeTower ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-blue-50 hover:text-blue-800"}`}>Tower {tower}</button>)}</div></div>
              <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-bold text-slate-600">Each coloured cell shows its unit number and live availability. Grey cells are core or service positions; dashed cells are non-saleable on that floor. Select a unit to see its type and facing.</p><label className="relative block w-full sm:w-44"><span className="sr-only">Select floor</span><select value={activeFloor} onChange={(event) => { setSelectedFloor(Number(event.target.value)); setSelectedUnitId(null); }} className="h-10 w-full appearance-none border border-slate-200 bg-white px-3 pr-9 text-sm font-black text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">{floors.map((floor) => <option key={floor} value={floor}>Floor {floor}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-slate-500" /></label></div>
              <div className="overflow-auto py-5">
                <div className="min-w-[55rem]" style={{ minWidth: `${Math.max(55, physicalStacks.length * 3.2 + 5)}rem` }}>
                  <div className="grid border border-slate-200" style={{ gridTemplateColumns: focusColumns }}>
                    <div className="flex items-center justify-center border-b border-r border-slate-200 bg-slate-100 px-3 text-xs font-black text-slate-600">Facing</div>
                    {renderMetadataCells("facing")}
                    <div className="flex items-center justify-center border-b border-r border-slate-200 bg-slate-100 px-3 text-xs font-black text-slate-600">Type</div>
                    {renderMetadataCells("type")}
                    <div className="flex items-center justify-center border-b border-r border-slate-200 bg-slate-100 px-3 text-xs font-black text-slate-600">BUA</div>
                    {renderMetadataCells("bua")}
                    <div className="flex items-center justify-center border-r border-slate-200 bg-slate-100 px-3 text-xs font-black text-slate-600">Unit No.</div>
                    {renderMetadataCells("unit")}
                  </div>
                  <div className="grid gap-1" style={{ gridTemplateColumns: elevationColumns }}>
                    {floors.map((floor) => <div key={floor} className="col-span-full">
                      {floor === 1 ? renderTypeExceptionRow(floor) : null}
                      <div className="grid gap-1" style={{ gridTemplateColumns: elevationColumns }}>
                        <button type="button" onClick={() => { setSelectedFloor(floor); setSelectedUnitId(null); }} className={`flex h-7 items-center justify-center text-[0.68rem] font-black transition ${floor === activeFloor ? "text-blue-700" : "text-slate-400 hover:text-slate-950"}`}>
                          {floor}
                        </button>
                        {renderElevationRow(floor)}
                      </div>
                    </div>)}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-6 xl:self-start">{selectedUnit ? <div><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Selected residence</p><h2 className="mt-2 text-2xl font-black text-slate-950">{selectedUnit.unitNo}</h2></div><button type="button" onClick={() => setSelectedUnitId(null)} className="grid size-9 place-items-center border border-slate-200 text-slate-500 transition hover:bg-slate-50" aria-label="Close selected residence"><X className="size-4" /></button></div><span className={`mt-5 inline-flex items-center gap-2 border px-3 py-1.5 text-xs font-black ${statusStyles[getUnitStatus(selectedUnit.bookingStatusCode)].cell}`}><span className={`size-2 rounded-full ${statusStyles[getUnitStatus(selectedUnit.bookingStatusCode)].swatch}`} />{selectedUnit.bookingStatusName ?? statusStyles[getUnitStatus(selectedUnit.bookingStatusCode)].label}</span><div className="mt-8 space-y-5 border-y border-slate-100 py-5 text-sm"><div className="flex items-center justify-between"><span className="text-slate-500">Type</span><span className="font-black text-slate-950">{selectedLayout?.code ?? "-"}</span></div><div className="flex items-center justify-between"><span className="text-slate-500">Facing</span><span className="inline-flex items-center gap-1 font-black text-slate-950"><Compass className="size-3 text-blue-600" />{selectedUnit.facing ?? "-"}</span></div><div className="flex items-center justify-between"><span className="text-slate-500">Floor / stack</span><span className="font-black text-slate-950">{selectedUnit.floor} / {selectedUnit.stack}</span></div><div className="flex items-center justify-between"><span className="text-slate-500">Built-up</span><span className="font-black text-slate-950">{selectedUnit.builtUpSqft ? `${selectedUnit.builtUpSqft} sqft` : "-"}</span></div></div><p className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Current price</p><p className="mt-2 flex items-center gap-2 text-2xl font-black text-slate-950"><CircleDollarSign className="size-5 text-emerald-600" />{formatMoney(selectedUnit.finalPrice ?? selectedUnit.basePrice)}</p></div> : <div className="flex min-h-72 flex-col justify-end border-l-4 border-blue-600 pl-5"><p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Residence details</p><h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Select a unit</h2><p className="mt-3 max-w-xs text-sm leading-6 text-slate-600">Choose Tower B or C, then select a unit to inspect its number, type, facing and price.</p><div className="mt-8 flex items-center gap-2 text-sm font-bold text-slate-500"><Ruler className="size-4 text-blue-600" />Tower {activeTower} has {actualStacks.length} sellable stacks</div></div>}</aside>
        </div>
      </div>
    </div>
  );
}