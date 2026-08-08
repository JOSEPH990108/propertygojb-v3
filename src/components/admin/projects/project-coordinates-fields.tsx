"use client";

import { useMemo, useState } from "react";
import { MapPinned, Sparkles } from "lucide-react";

import { AppButton } from "@/components/common/app-button";
import { Input } from "@/components/ui/input";
import { appToast } from "@/lib/app-toast";

type ProjectCoordinatesFieldsProps = {
  projectName: string;
  address: string;
  regionName?: string | null;
  areaName?: string | null;
  latitude: string;
  longitude: string;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
};

export function ProjectCoordinatesFields({
  projectName,
  address,
  regionName,
  areaName,
  latitude,
  longitude,
  onLatitudeChange,
  onLongitudeChange,
}: ProjectCoordinatesFieldsProps) {
  const [isAutofilling, setIsAutofilling] = useState(false);

  const geocodeQuery = useMemo(() => {
    return [projectName, address, areaName, regionName, "Malaysia"]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value))
      .join(", ");
  }, [address, areaName, projectName, regionName]);

  async function handleAutofill() {
    const query = geocodeQuery.trim();

    if (!query) {
      appToast.error("Add a project name or address first.");
      return;
    }

    setIsAutofilling(true);

    try {
      const response = await fetch(`/api/public/geocode?q=${encodeURIComponent(query)}`);

      if (response.status === 429) {
        appToast.error(
          "Geocoding service is rate-limited right now. Enter coordinates manually or try later.",
        );
        return;
      }

      const payload = (await response.json()) as {
        results?: Array<{ lat: string; lon: string }>;
      };
      const result = payload.results?.[0];

      if (!result) {
        appToast.error("No coordinate match found for this address.");
        return;
      }

      onLatitudeChange(result.lat);
      onLongitudeChange(result.lon);
      appToast.success("Coordinates filled from address.");
    } catch {
      appToast.error("Unable to geocode this project right now.");
    } finally {
      setIsAutofilling(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid size-10 place-items-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <MapPinned className="size-4" />
            </span>
            <div>
              <p className="text-sm font-black tracking-tight text-slate-950">
                Map Pin Override
              </p>
              <p className="text-sm text-slate-500">
                Set exact coordinates for the public map.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1">Manual override</span>
            <span className="rounded-full bg-slate-100 px-3 py-1">Geocode fallback</span>
            <span className="rounded-full bg-slate-100 px-3 py-1">Used by public map</span>
          </div>
        </div>

        <AppButton
          type="button"
          variant="secondary"
          onClick={handleAutofill}
          disabled={isAutofilling}
          className="h-11 rounded-full border-blue-200 bg-blue-50 px-5 text-blue-700 hover:bg-blue-100"
        >
          <Sparkles className="mr-2 size-4" />
          {isAutofilling ? "Finding pin..." : "Autofill from address"}
        </AppButton>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">Latitude</span>
          <Input
            value={latitude}
            onChange={(event) => onLatitudeChange(event.target.value)}
            placeholder="1.51234567"
            inputMode="decimal"
            className="h-12 rounded-2xl border-slate-200 bg-slate-50 font-medium text-slate-900 shadow-none placeholder:text-slate-400"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">Longitude</span>
          <Input
            value={longitude}
            onChange={(event) => onLongitudeChange(event.target.value)}
            placeholder="103.71234567"
            inputMode="decimal"
            className="h-12 rounded-2xl border-slate-200 bg-slate-50 font-medium text-slate-900 shadow-none placeholder:text-slate-400"
          />
        </label>
      </div>
    </section>
  );
}