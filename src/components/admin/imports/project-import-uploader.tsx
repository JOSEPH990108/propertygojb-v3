"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useState, useTransition } from "react";

import { AppButton } from "@/components/common/app-button";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";
import { appConfirm } from "@/lib/app-confirm";

type ImportResponse = {
  ok: boolean;
  message: string;
  projectId?: string;
  projectName?: string;
  projectSlug?: string;
  existingProject?: boolean;
  createdOrUpdated?: "created" | "updated";
  counts?: {
    layouts: number;
    units: number;
    amenities: number;
    tags: number;
    nearbyPlaces: number;
  };
  warnings?: string[];
};

const defaultImportText = `{
  "version": 1,
  "type": "project-import",
  "mode": "upsert",
  "project": {
    "name": "Vistara Hill",
    "slug": "vistara-hill",
    "developerName": "Yashi Land Sdn. Bhd.",
    "propertyCategory": { "code": "LANDED", "name": "Landed" },
    "propertyType": { "code": "CLUSTER_HOUSE", "name": "Cluster House" },
    "tenureType": { "code": "LEASEHOLD", "name": "Leasehold" },
    "projectStatus": { "code": "COMING_SOON", "name": "Coming Soon" },
    "totalUnits": 120,
    "launchYear": 2028,
    "completionText": "2028 Q2",
    "isHotDeal": false,
    "isPublished": false,
    "location": {
      "country": "Malaysia",
      "state": "Johor",
      "region": "Johor Bahru",
      "area": "Taman Bukit Skudai",
      "address": "Taman Bukit Skudai"
    }
  },
  "layouts": [
    {
      "code": "A1",
      "name": "Type A1",
      "layoutType": { "code": "CLUSTER", "name": "Cluster" },
      "builtUpSqft": 3156,
      "bedrooms": 4,
      "bathrooms": 4,
      "studyRooms": 0
    },
    {
      "code": "A2",
      "name": "Type A2",
      "layoutType": { "code": "CLUSTER", "name": "Cluster" },
      "builtUpSqft": 3048,
      "bedrooms": 4,
      "bathrooms": 4,
      "studyRooms": 0
    }
  ],
  "units": [
    {
      "unitNo": "170313",
      "layoutCode": "A1",
      "lotType": { "code": "BUMI", "name": "Bumi" },
      "bookingStatus": { "code": "BOOKING", "name": "Booking" },
      "builtUpSqft": 3156,
      "basePrice": 1477480,
      "finalPrice": 1359281.6
    },
    {
      "unitNo": "170317",
      "layoutCode": "A1",
      "lotType": { "code": "NON_BUMI", "name": "Non Bumi" },
      "bookingStatus": { "code": "BOOKING", "name": "Booking" },
      "builtUpSqft": 3156,
      "basePrice": 1283480,
      "finalPrice": 1180801.6
    },
    {
      "unitNo": "170319",
      "layoutCode": "A1",
      "lotType": { "code": "NON_BUMI", "name": "Non Bumi" },
      "bookingStatus": { "code": "AVAILABLE", "name": "Available" },
      "builtUpSqft": 3156,
      "basePrice": 1283480,
      "finalPrice": 1180801.6
    }
  ],
  "amenities": ["Gated Community"],
  "tags": ["Free MOT", "8% Rebate", "Free Legal Fee SPA & LA"],
  "nearbyPlaces": []
}`;

function parseImportJson(rawText: string) {
  try {
    return {
      ok: true as const,
      payload: JSON.parse(rawText) as unknown,
      error: null,
    };
  } catch {
    return {
      ok: false as const,
      payload: null,
      error: "Invalid JSON format.",
    };
  }
}

export function ProjectImportUploader() {
  const [rawText, setRawText] = useState(defaultImportText);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [isPending, startTransition] = useTransition();

  const parsed = useMemo(() => parseImportJson(rawText), [rawText]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setRawText(String(reader.result ?? ""));
      setResult(null);
    };

    reader.readAsText(file);
  }

  function handlePreview() {
    if (!parsed.ok) {
      appToast.error(parsed.error);
      return;
    }

    startTransition(async () => {
      const response = await postJson<ImportResponse>("/api/admin/imports/project", {
        action: "preview",
        payload: parsed.payload,
      });

      if (!response.ok) {
        appToast.error(response.message);
        return;
      }

      setResult(response);
      appToast.success("Preview generated.");
    });
  }

  async function handleExecute() {
    if (!parsed.ok) {
      appToast.error(parsed.error);
      return;
    }

    const confirmed = await appConfirm({
      title: "Execute import script?",
      description:
        "Existing project data with the same slug and unit numbers will be updated. This will not execute JavaScript or TypeScript code.",
      confirmText: "Execute Import",
      cancelText: "Cancel",
      tone: "warning",
    });

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const response = await postJson<ImportResponse>("/api/admin/imports/project", {
        action: "execute",
        payload: parsed.payload,
      });

      if (!response.ok) {
        appToast.error(response.message);
        return;
      }

      setResult(response);
      appToast.success("Import executed successfully.");
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black tracking-tight text-slate-950">
          Upload Import Script
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Upload a safe JSON import script. This does not execute JavaScript or
          TypeScript code.
        </p>

        <div className="mt-6 grid gap-4">
          <input
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="block w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700"
          />

          <textarea
            value={rawText}
            onChange={(event) => {
              setRawText(event.target.value);
              setResult(null);
            }}
            rows={22}
            spellCheck={false}
            className="w-full rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />

          {!parsed.ok ? (
            <p className="text-sm font-bold text-red-600">{parsed.error}</p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <AppButton
              type="button"
              variant="secondary"
              disabled={isPending || !parsed.ok}
              onClick={handlePreview}
              className="h-11 rounded-xl px-5 text-sm"
            >
              Preview Import
            </AppButton>

            <AppButton
              type="button"
              disabled={isPending || !parsed.ok}
              onClick={handleExecute}
              className="h-11 rounded-xl px-5 text-sm"
            >
              Execute Import
            </AppButton>
          </div>
        </div>
      </section>

      {result ? (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-950">
                Import Result
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {result.message}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {result.existingProject !== undefined ? (
                <AppStatusBadge tone={result.existingProject ? "warning" : "success"}>
                  {result.existingProject ? "Existing Project" : "New Project"}
                </AppStatusBadge>
              ) : null}

              {result.createdOrUpdated ? (
                <AppStatusBadge tone="info">{result.createdOrUpdated}</AppStatusBadge>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Layouts
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {result.counts?.layouts ?? 0}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Units
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {result.counts?.units ?? 0}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Amenities
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {result.counts?.amenities ?? 0}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Tags
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {result.counts?.tags ?? 0}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Nearby
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {result.counts?.nearbyPlaces ?? 0}
              </p>
            </div>
          </div>

          {result.warnings && result.warnings.length > 0 ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-black text-amber-800">Warnings</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold text-amber-700">
                {result.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.projectId ? (
            <div className="mt-6">
              <Link
                href={`/admin/projects/${result.projectId}`}
                className="inline-flex h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                Open Imported Project
              </Link>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
