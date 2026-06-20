"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AppButton } from "@/components/common/app-button";
import { AppSelect } from "@/components/common/app-select";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";
import { appConfirm } from "@/lib/app-confirm";

type LayoutTypeOption = {
  id: string;
  name: string;
  code: string;
};

type ProjectLayoutItem = {
  id: string;
  code: string;
  name: string | null;
  layoutTypeId: string | null;
  layoutTypeName: string | null;
  builtUpSqft: string;
  bedrooms: number;
  bathrooms: number;
  studyRooms: number;
  hasBalcony: boolean;
  hasYard: boolean;
  isDualKey: boolean;
  ceilingHeightM: string | null;
  furnishingStatus: string;
  floorPlanUrl: string | null;
  virtualTourUrl: string | null;
};

type ProjectLayoutManagerProps = {
  projectId: string;
  layoutTypes: LayoutTypeOption[];
  layouts: ProjectLayoutItem[];
};

const furnishingOptions = [
  { value: "UNFURNISHED", label: "Unfurnished" },
  { value: "PARTIALLY_FURNISHED", label: "Partially Furnished" },
  { value: "FULLY_FURNISHED", label: "Fully Furnished" },
];

function normalizeCode(value: string) {
  return value.toUpperCase().trim().replace(/\s+/g, "_");
}

function layoutTypeOptions(layoutTypes: LayoutTypeOption[]) {
  return [
    {
      value: "__none__",
      label: "No layout type",
    },
    ...layoutTypes.map((layoutType) => ({
      value: layoutType.id,
      label: `${layoutType.name} (${layoutType.code})`,
    })),
  ];
}

function ProjectLayoutRow({
  projectId,
  layout,
  layoutTypes,
}: {
  projectId: string;
  layout: ProjectLayoutItem;
  layoutTypes: LayoutTypeOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [code, setCode] = useState(layout.code);
  const [name, setName] = useState(layout.name ?? "");
  const [layoutTypeId, setLayoutTypeId] = useState(
    layout.layoutTypeId ?? "__none__",
  );
  const [builtUpSqft, setBuiltUpSqft] = useState(layout.builtUpSqft);
  const [bedrooms, setBedrooms] = useState(String(layout.bedrooms));
  const [bathrooms, setBathrooms] = useState(String(layout.bathrooms));
  const [studyRooms, setStudyRooms] = useState(String(layout.studyRooms));
  const [ceilingHeightM, setCeilingHeightM] = useState(
    layout.ceilingHeightM ?? "",
  );
  const [furnishingStatus, setFurnishingStatus] = useState(
    layout.furnishingStatus,
  );
  const [floorPlanUrl, setFloorPlanUrl] = useState(layout.floorPlanUrl ?? "");
  const [virtualTourUrl, setVirtualTourUrl] = useState(
    layout.virtualTourUrl ?? "",
  );
  const [hasBalcony, setHasBalcony] = useState(layout.hasBalcony);
  const [hasYard, setHasYard] = useState(layout.hasYard);
  const [isDualKey, setIsDualKey] = useState(layout.isDualKey);

  function handleUpdate() {
    startTransition(async () => {
      const result = await postJson(`/api/admin/projects/${projectId}/layouts`, {
        action: "update",
        layoutId: layout.id,
        code,
        name,
        layoutTypeId,
        builtUpSqft,
        bedrooms,
        bathrooms,
        studyRooms,
        hasBalcony,
        hasYard,
        isDualKey,
        ceilingHeightM: ceilingHeightM ? Number(ceilingHeightM) : null,
        furnishingStatus,
        floorPlanUrl,
        virtualTourUrl,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success("Project layout updated.");
      router.refresh();
    });
  }

  async function handleRemove() {
    const confirmed = await appConfirm({
      title: "Remove project layout?",
      description:
        "This will remove this layout from the project. This may fail if units are still linked to this layout.",
      confirmText: "Remove Layout",
      cancelText: "Keep Layout",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await postJson(`/api/admin/projects/${projectId}/layouts`, {
        action: "remove",
        layoutId: layout.id,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success("Project layout removed.");
      router.refresh();
    });
  }

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-slate-950">
              {layout.name || layout.code}
            </h3>

            <AppStatusBadge tone="info">
              {layout.builtUpSqft} sqft
            </AppStatusBadge>

            {layout.layoutTypeName ? (
              <AppStatusBadge tone="success">
                {layout.layoutTypeName}
              </AppStatusBadge>
            ) : null}
          </div>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            {layout.bedrooms} Bed / {layout.bathrooms} Bath
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {floorPlanUrl ? (
            <Link
              href={floorPlanUrl}
              target="_blank"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
            >
              Floor Plan
            </Link>
          ) : null}

          {virtualTourUrl ? (
            <Link
              href={virtualTourUrl}
              target="_blank"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-purple-200 bg-purple-50 px-4 text-sm font-bold text-purple-700 transition hover:bg-purple-100"
            >
              Virtual Tour
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-4">
        <Input
          value={code}
          onChange={(event) => setCode(normalizeCode(event.target.value))}
          className="h-11 rounded-xl"
        />

        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Layout name"
          className="h-11 rounded-xl"
        />

        <AppSelect
          value={layoutTypeId}
          onValueChange={setLayoutTypeId}
          placeholder="Layout type"
          options={layoutTypeOptions(layoutTypes)}
          triggerClassName="h-11 w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-semibold"
          contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl"
        />

        <AppSelect
          value={furnishingStatus}
          onValueChange={setFurnishingStatus}
          placeholder="Furnishing"
          options={furnishingOptions}
          triggerClassName="h-11 w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-semibold"
          contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl"
        />

        <Input
          type="number"
          min={1}
          value={builtUpSqft}
          onChange={(event) => setBuiltUpSqft(event.target.value)}
          placeholder="Built-up sqft"
          className="h-11 rounded-xl"
        />

        <Input
          type="number"
          min={0}
          value={bedrooms}
          onChange={(event) => setBedrooms(event.target.value)}
          placeholder="Bedrooms"
          className="h-11 rounded-xl"
        />

        <Input
          type="number"
          min={0}
          value={bathrooms}
          onChange={(event) => setBathrooms(event.target.value)}
          placeholder="Bathrooms"
          className="h-11 rounded-xl"
        />

        <Input
          type="number"
          min={0}
          value={studyRooms}
          onChange={(event) => setStudyRooms(event.target.value)}
          placeholder="Study rooms"
          className="h-11 rounded-xl"
        />

        <Input
          type="number"
          min={0}
          value={ceilingHeightM}
          onChange={(event) => setCeilingHeightM(event.target.value)}
          placeholder="Ceiling height m"
          className="h-11 rounded-xl"
        />

        <Input
          value={floorPlanUrl}
          onChange={(event) => setFloorPlanUrl(event.target.value)}
          placeholder="Floor plan URL"
          className="h-11 rounded-xl xl:col-span-2"
        />

        <Input
          value={virtualTourUrl}
          onChange={(event) => setVirtualTourUrl(event.target.value)}
          placeholder="Virtual tour URL"
          className="h-11 rounded-xl"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              checked={hasBalcony}
              onChange={(event) => setHasBalcony(event.target.checked)}
              className="size-4"
            />
            Balcony
          </label>

          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              checked={hasYard}
              onChange={(event) => setHasYard(event.target.checked)}
              className="size-4"
            />
            Yard
          </label>

          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              checked={isDualKey}
              onChange={(event) => setIsDualKey(event.target.checked)}
              className="size-4"
            />
            Dual Key
          </label>
        </div>

        <div className="flex gap-2">
          <AppButton
            type="button"
            disabled={isPending}
            onClick={handleUpdate}
            className="h-10 rounded-xl px-4 text-sm"
          >
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
    </div>
  );
}

export function ProjectLayoutManager({
  projectId,
  layoutTypes,
  layouts,
}: ProjectLayoutManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [layoutTypeId, setLayoutTypeId] = useState("__none__");
  const [builtUpSqft, setBuiltUpSqft] = useState("");
  const [bedrooms, setBedrooms] = useState("3");
  const [bathrooms, setBathrooms] = useState("2");
  const [studyRooms, setStudyRooms] = useState("0");
  const [ceilingHeightM, setCeilingHeightM] = useState("");
  const [furnishingStatus, setFurnishingStatus] = useState("UNFURNISHED");
  const [floorPlanUrl, setFloorPlanUrl] = useState("");
  const [virtualTourUrl, setVirtualTourUrl] = useState("");
  const [hasBalcony, setHasBalcony] = useState(false);
  const [hasYard, setHasYard] = useState(false);
  const [isDualKey, setIsDualKey] = useState(false);

  function handleCreate() {
    startTransition(async () => {
      const result = await postJson(`/api/admin/projects/${projectId}/layouts`, {
        action: "create",
        code,
        name,
        layoutTypeId,
        builtUpSqft,
        bedrooms,
        bathrooms,
        studyRooms,
        hasBalcony,
        hasYard,
        isDualKey,
        ceilingHeightM: ceilingHeightM ? Number(ceilingHeightM) : null,
        furnishingStatus,
        floorPlanUrl,
        virtualTourUrl,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      setCode("");
      setName("");
      setBuiltUpSqft("");
      setBedrooms("3");
      setBathrooms("2");
      setStudyRooms("0");
      setCeilingHeightM("");
      setFloorPlanUrl("");
      setVirtualTourUrl("");
      setHasBalcony(false);
      setHasYard(false);
      setIsDualKey(false);

      appToast.success("Project layout created.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black tracking-tight text-slate-950">
          Add Layout
        </h2>

        <div className="mt-6 grid gap-4 xl:grid-cols-4">
          <Input
            value={code}
            onChange={(event) => setCode(normalizeCode(event.target.value))}
            placeholder="TYPE_A"
            className="h-11 rounded-xl"
          />

          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Type A"
            className="h-11 rounded-xl"
          />

          <AppSelect
            value={layoutTypeId}
            onValueChange={setLayoutTypeId}
            placeholder="Layout type"
            options={layoutTypeOptions(layoutTypes)}
            triggerClassName="h-11 w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-semibold"
            contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl"
          />

          <AppSelect
            value={furnishingStatus}
            onValueChange={setFurnishingStatus}
            placeholder="Furnishing"
            options={furnishingOptions}
            triggerClassName="h-11 w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-semibold"
            contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl"
          />

          <Input
            type="number"
            min={1}
            value={builtUpSqft}
            onChange={(event) => setBuiltUpSqft(event.target.value)}
            placeholder="Built-up sqft"
            className="h-11 rounded-xl"
          />

          <Input
            type="number"
            min={0}
            value={bedrooms}
            onChange={(event) => setBedrooms(event.target.value)}
            placeholder="Bedrooms"
            className="h-11 rounded-xl"
          />

          <Input
            type="number"
            min={0}
            value={bathrooms}
            onChange={(event) => setBathrooms(event.target.value)}
            placeholder="Bathrooms"
            className="h-11 rounded-xl"
          />

          <Input
            type="number"
            min={0}
            value={studyRooms}
            onChange={(event) => setStudyRooms(event.target.value)}
            placeholder="Study rooms"
            className="h-11 rounded-xl"
          />

          <Input
            type="number"
            min={0}
            value={ceilingHeightM}
            onChange={(event) => setCeilingHeightM(event.target.value)}
            placeholder="Ceiling height m"
            className="h-11 rounded-xl"
          />

          <Input
            value={floorPlanUrl}
            onChange={(event) => setFloorPlanUrl(event.target.value)}
            placeholder="Floor plan URL"
            className="h-11 rounded-xl xl:col-span-2"
          />

          <Input
            value={virtualTourUrl}
            onChange={(event) => setVirtualTourUrl(event.target.value)}
            placeholder="Virtual tour URL"
            className="h-11 rounded-xl"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={hasBalcony}
                onChange={(event) => setHasBalcony(event.target.checked)}
                className="size-4"
              />
              Balcony
            </label>

            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={hasYard}
                onChange={(event) => setHasYard(event.target.checked)}
                className="size-4"
              />
              Yard
            </label>

            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={isDualKey}
                onChange={(event) => setIsDualKey(event.target.checked)}
                className="size-4"
              />
              Dual Key
            </label>
          </div>

          <AppButton
            type="button"
            disabled={isPending || !code.trim() || !builtUpSqft.trim()}
            onClick={handleCreate}
            className="h-11 rounded-xl px-5 text-sm"
          >
            {isPending ? "Adding..." : "Add Layout"}
          </AppButton>
        </div>
      </section>

      <section className="space-y-4">
        {layouts.map((layout) => (
          <ProjectLayoutRow
            key={layout.id}
            projectId={projectId}
            layout={layout}
            layoutTypes={layoutTypes}
          />
        ))}

        {layouts.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-sm font-bold text-slate-700">
              No project layouts found.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Add the first layout above.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
