"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AppButton } from "@/components/common/app-button";
import { AppSelect } from "@/components/common/app-select";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";
import { appConfirm } from "@/lib/app-confirm";

type SelectOption = {
  id: string;
  name: string;
  code?: string | null;
};

type UnitItem = {
  id: string;
  layoutId: string | null;
  layoutName: string | null;
  unitNo: string;
  floor: number | null;
  stack: string | null;
  streetName: string | null;
  displaySequence: number;
  builtUpSqft: string | null;
  landAreaSqft: string | null;
  dimensionText: string | null;
  facing: string | null;
  positionTypeId: string | null;
  positionTypeName: string | null;
  carparkCount: number;
  carparkLotNo: string | null;
  carparkType: string | null;
  lotTypeId: string;
  lotTypeName: string | null;
  bookingStatusId: string;
  bookingStatusName: string | null;
  basePrice: string;
  finalPrice: string | null;
};

type ProjectUnitManagerProps = {
  projectId: string;
  layouts: SelectOption[];
  lotTypes: SelectOption[];
  bookingStatuses: SelectOption[];
  unitPositions: SelectOption[];
  units: UnitItem[];
};

function selectOptions(options: SelectOption[], includeNone = false) {
  const mapped = options.map((option) => ({
    value: option.id,
    label: option.code ? `${option.name} (${option.code})` : option.name,
  }));

  if (!includeNone) {
    return mapped;
  }

  return [{ value: "__none__", label: "None" }, ...mapped];
}

function moneyLabel(value: string | null) {
  if (!value) {
    return "-";
  }

  return `RM ${Number(value).toLocaleString("en-MY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function UnitRow({
  projectId,
  unit,
  layouts,
  lotTypes,
  bookingStatuses,
  unitPositions,
}: {
  projectId: string;
  unit: UnitItem;
  layouts: SelectOption[];
  lotTypes: SelectOption[];
  bookingStatuses: SelectOption[];
  unitPositions: SelectOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [layoutId, setLayoutId] = useState(unit.layoutId ?? "__none__");
  const [unitNo, setUnitNo] = useState(unit.unitNo);
  const [floor, setFloor] = useState(unit.floor?.toString() ?? "");
  const [stack, setStack] = useState(unit.stack ?? "");
  const [streetName, setStreetName] = useState(unit.streetName ?? "");
  const [displaySequence, setDisplaySequence] = useState(String(unit.displaySequence));
  const [builtUpSqft, setBuiltUpSqft] = useState(unit.builtUpSqft ?? "");
  const [landAreaSqft, setLandAreaSqft] = useState(unit.landAreaSqft ?? "");
  const [dimensionText, setDimensionText] = useState(unit.dimensionText ?? "");
  const [facing, setFacing] = useState(unit.facing ?? "");
  const [positionTypeId, setPositionTypeId] = useState(
    unit.positionTypeId ?? "__none__",
  );
  const [carparkCount, setCarparkCount] = useState(String(unit.carparkCount));
  const [carparkLotNo, setCarparkLotNo] = useState(unit.carparkLotNo ?? "");
  const [carparkType, setCarparkType] = useState(unit.carparkType ?? "");
  const [lotTypeId, setLotTypeId] = useState(unit.lotTypeId);
  const [bookingStatusId, setBookingStatusId] = useState(unit.bookingStatusId);
  const [basePrice, setBasePrice] = useState(unit.basePrice);
  const [finalPrice, setFinalPrice] = useState(unit.finalPrice ?? "");

  function handleUpdate() {
    startTransition(async () => {
      const result = await postJson(`/api/admin/projects/${projectId}/units`, {
        action: "update",
        unitId: unit.id,
        layoutId,
        unitNo,
        floor,
        stack,
        streetName,
        displaySequence,
        builtUpSqft,
        landAreaSqft,
        dimensionText,
        facing,
        positionTypeId,
        carparkCount,
        carparkLotNo,
        carparkType,
        lotTypeId,
        bookingStatusId,
        basePrice,
        finalPrice,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success("Unit updated.");
      router.refresh();
    });
  }

  async function handleRemove() {
    const confirmed = await appConfirm({
      title: "Remove project unit?",
      description:
        "This will remove this unit from the project inventory. This may fail if bookings or related records are linked.",
      confirmText: "Remove Unit",
      cancelText: "Keep Unit",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await postJson(`/api/admin/projects/${projectId}/units`, {
        action: "remove",
        unitId: unit.id,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success("Unit removed.");
      router.refresh();
    });
  }

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-slate-950">
              Unit {unit.unitNo}
            </h3>

            <AppStatusBadge tone="info">
              {unit.bookingStatusName ?? "Status"}
            </AppStatusBadge>

            <AppStatusBadge tone="success">
              {moneyLabel(unit.finalPrice ?? unit.basePrice)}
            </AppStatusBadge>
          </div>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            {unit.layoutName ?? "No layout"} / {unit.lotTypeName ?? "Lot type"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-4">
        <Input value={unitNo} onChange={(e) => setUnitNo(e.target.value)} placeholder="Unit No" className="h-11 rounded-xl" />

        <AppSelect
          value={layoutId}
          onValueChange={setLayoutId}
          placeholder="Layout"
          options={selectOptions(layouts, true)}
          triggerClassName="h-11 w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-semibold"
          contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl"
        />

        <AppSelect
          value={lotTypeId}
          onValueChange={setLotTypeId}
          placeholder="Lot type"
          options={selectOptions(lotTypes)}
          triggerClassName="h-11 w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-semibold"
          contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl"
        />

        <AppSelect
          value={bookingStatusId}
          onValueChange={setBookingStatusId}
          placeholder="Booking status"
          options={selectOptions(bookingStatuses)}
          triggerClassName="h-11 w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-semibold"
          contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl"
        />

        <Input type="number" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="Floor" className="h-11 rounded-xl" />
        <Input value={stack} onChange={(e) => setStack(e.target.value)} placeholder="Stack" className="h-11 rounded-xl" />
        <Input value={streetName} onChange={(e) => setStreetName(e.target.value)} placeholder="Street name" className="h-11 rounded-xl" />
        <Input type="number" min={0} value={displaySequence} onChange={(e) => setDisplaySequence(e.target.value)} placeholder="Display order" className="h-11 rounded-xl" />

        <Input type="number" min={0} value={builtUpSqft} onChange={(e) => setBuiltUpSqft(e.target.value)} placeholder="Built-up sqft" className="h-11 rounded-xl" />
        <Input type="number" min={0} value={landAreaSqft} onChange={(e) => setLandAreaSqft(e.target.value)} placeholder="Land area sqft" className="h-11 rounded-xl" />
        <Input value={dimensionText} onChange={(e) => setDimensionText(e.target.value)} placeholder="Dimension e.g. 20x70" className="h-11 rounded-xl" />
        <Input value={facing} onChange={(e) => setFacing(e.target.value)} placeholder="Facing" className="h-11 rounded-xl" />

        <AppSelect
          value={positionTypeId}
          onValueChange={setPositionTypeId}
          placeholder="Position"
          options={selectOptions(unitPositions, true)}
          triggerClassName="h-11 w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-semibold"
          contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl"
        />

        <Input type="number" min={0} value={carparkCount} onChange={(e) => setCarparkCount(e.target.value)} placeholder="Carpark count" className="h-11 rounded-xl" />
        <Input value={carparkLotNo} onChange={(e) => setCarparkLotNo(e.target.value)} placeholder="Carpark lot no" className="h-11 rounded-xl" />
        <Input value={carparkType} onChange={(e) => setCarparkType(e.target.value)} placeholder="Carpark type" className="h-11 rounded-xl" />

        <Input type="number" min={0} value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="Base price" className="h-11 rounded-xl" />
        <Input type="number" min={0} value={finalPrice} onChange={(e) => setFinalPrice(e.target.value)} placeholder="Final price" className="h-11 rounded-xl" />
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <AppButton type="button" disabled={isPending} onClick={handleUpdate} className="h-10 rounded-xl px-4 text-sm">
          Save
        </AppButton>

        <button
          type="button"
          disabled={isPending}
          onClick={handleRemove}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export function ProjectUnitManager({
  projectId,
  layouts,
  lotTypes,
  bookingStatuses,
  unitPositions,
  units,
}: ProjectUnitManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [layoutId, setLayoutId] = useState("__none__");
  const [unitNo, setUnitNo] = useState("");
  const [floor, setFloor] = useState("");
  const [stack, setStack] = useState("");
  const [streetName, setStreetName] = useState("");
  const [displaySequence, setDisplaySequence] = useState("0");
  const [builtUpSqft, setBuiltUpSqft] = useState("");
  const [landAreaSqft, setLandAreaSqft] = useState("");
  const [dimensionText, setDimensionText] = useState("");
  const [facing, setFacing] = useState("");
  const [positionTypeId, setPositionTypeId] = useState("__none__");
  const [carparkCount, setCarparkCount] = useState("1");
  const [carparkLotNo, setCarparkLotNo] = useState("");
  const [carparkType, setCarparkType] = useState("");
  const [lotTypeId, setLotTypeId] = useState(lotTypes[0]?.id ?? "");
  const [bookingStatusId, setBookingStatusId] = useState(
    bookingStatuses[0]?.id ?? "",
  );
  const [basePrice, setBasePrice] = useState("");
  const [finalPrice, setFinalPrice] = useState("");

  function handleCreate() {
    startTransition(async () => {
      const result = await postJson(`/api/admin/projects/${projectId}/units`, {
        action: "create",
        layoutId,
        unitNo,
        floor,
        stack,
        streetName,
        displaySequence,
        builtUpSqft,
        landAreaSqft,
        dimensionText,
        facing,
        positionTypeId,
        carparkCount,
        carparkLotNo,
        carparkType,
        lotTypeId,
        bookingStatusId,
        basePrice,
        finalPrice,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      setUnitNo("");
      setFloor("");
      setStack("");
      setStreetName("");
      setDisplaySequence("0");
      setBuiltUpSqft("");
      setLandAreaSqft("");
      setDimensionText("");
      setFacing("");
      setCarparkCount("1");
      setCarparkLotNo("");
      setCarparkType("");
      setBasePrice("");
      setFinalPrice("");

      appToast.success("Unit created.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black tracking-tight text-slate-950">
          Add Unit
        </h2>

        <div className="mt-6 grid gap-4 xl:grid-cols-4">
          <Input value={unitNo} onChange={(e) => setUnitNo(e.target.value)} placeholder="Unit No" className="h-11 rounded-xl" />

          <AppSelect value={layoutId} onValueChange={setLayoutId} placeholder="Layout" options={selectOptions(layouts, true)} triggerClassName="h-11 w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-semibold" contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl" />
          <AppSelect value={lotTypeId} onValueChange={setLotTypeId} placeholder="Lot type" options={selectOptions(lotTypes)} triggerClassName="h-11 w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-semibold" contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl" />
          <AppSelect value={bookingStatusId} onValueChange={setBookingStatusId} placeholder="Booking status" options={selectOptions(bookingStatuses)} triggerClassName="h-11 w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-semibold" contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl" />

          <Input type="number" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="Floor" className="h-11 rounded-xl" />
          <Input value={stack} onChange={(e) => setStack(e.target.value)} placeholder="Stack" className="h-11 rounded-xl" />
          <Input value={streetName} onChange={(e) => setStreetName(e.target.value)} placeholder="Street name" className="h-11 rounded-xl" />
          <Input type="number" min={0} value={displaySequence} onChange={(e) => setDisplaySequence(e.target.value)} placeholder="Display order" className="h-11 rounded-xl" />

          <Input type="number" min={0} value={builtUpSqft} onChange={(e) => setBuiltUpSqft(e.target.value)} placeholder="Built-up sqft" className="h-11 rounded-xl" />
          <Input type="number" min={0} value={landAreaSqft} onChange={(e) => setLandAreaSqft(e.target.value)} placeholder="Land area sqft" className="h-11 rounded-xl" />
          <Input value={dimensionText} onChange={(e) => setDimensionText(e.target.value)} placeholder="Dimension e.g. 20x70" className="h-11 rounded-xl" />
          <Input value={facing} onChange={(e) => setFacing(e.target.value)} placeholder="Facing" className="h-11 rounded-xl" />

          <AppSelect value={positionTypeId} onValueChange={setPositionTypeId} placeholder="Position" options={selectOptions(unitPositions, true)} triggerClassName="h-11 w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-semibold" contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl" />
          <Input type="number" min={0} value={carparkCount} onChange={(e) => setCarparkCount(e.target.value)} placeholder="Carpark count" className="h-11 rounded-xl" />
          <Input value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="Base price" className="h-11 rounded-xl" />
          <Input value={finalPrice} onChange={(e) => setFinalPrice(e.target.value)} placeholder="Final price" className="h-11 rounded-xl" />
        </div>

        <div className="mt-5 flex justify-end">
          <AppButton
            type="button"
            disabled={
              isPending ||
              !unitNo.trim() ||
              !lotTypeId ||
              !bookingStatusId ||
              !basePrice.trim()
            }
            onClick={handleCreate}
            className="h-11 rounded-xl px-5 text-sm"
          >
            {isPending ? "Adding..." : "Add Unit"}
          </AppButton>
        </div>
      </section>

      <section className="space-y-4">
        {units.map((unit) => (
          <UnitRow
            key={unit.id}
            projectId={projectId}
            unit={unit}
            layouts={layouts}
            lotTypes={lotTypes}
            bookingStatuses={bookingStatuses}
            unitPositions={unitPositions}
          />
        ))}

        {units.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-sm font-bold text-slate-700">
              No units found.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Add the first unit above.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
