"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { LocateFixed, MapPinned, Navigation2, Radar, Search } from "lucide-react";
import { divIcon } from "leaflet";

import type { PublicProjectCard } from "@/lib/public/projects";

type LatLng = {
  lat: number;
  lng: number;
};

type GeocodeResult = {
  display_name: string;
  lat: string;
  lon: string;
};

const JOHOR_BAHRU_CENTER: LatLng = {
  lat: 1.4927,
  lng: 103.7414,
};

function parseCoordinate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function haversineDistanceKm(left: LatLng, right: LatLng) {
  const earthRadiusKm = 6371;
  const deltaLat = ((right.lat - left.lat) * Math.PI) / 180;
  const deltaLng = ((right.lng - left.lng) * Math.PI) / 180;
  const lat1 = (left.lat * Math.PI) / 180;
  const lat2 = (right.lat * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function MapSync({ center }: { center: LatLng }) {
  const map = useMap();

  useEffect(() => {
    map.setView([center.lat, center.lng], Math.max(map.getZoom(), 12), { animate: true });
  }, [center.lat, center.lng, map]);

  return null;
}

function MapDragSync({ onCenterChange }: { onCenterChange: (center: LatLng) => void }) {
  useMapEvents({
    dragend(event) {
      const map = event.target;
      const nextCenter = map.getCenter();
      onCenterChange({ lat: nextCenter.lat, lng: nextCenter.lng });
    },
  });

  return null;
}

export function PublicProjectsMap({ projects }: { projects: PublicProjectCard[] }) {
  const projectsWithCoordinates = useMemo(() => {
    return projects
      .map((project) => {
        const lat = parseCoordinate(project.latitude);
        const lng = parseCoordinate(project.longitude);

        if (lat === null || lng === null) {
          return null;
        }

        return {
          ...project,
          coordinates: { lat, lng },
        };
      })
      .filter((project): project is PublicProjectCard & { coordinates: LatLng } => project !== null);
  }, [projects]);

  const initialCenter = useMemo(() => {
    if (projectsWithCoordinates.length === 0) {
      return JOHOR_BAHRU_CENTER;
    }

    const total = projectsWithCoordinates.reduce(
      (accumulator, project) => {
        accumulator.lat += project.coordinates.lat;
        accumulator.lng += project.coordinates.lng;
        return accumulator;
      },
      { lat: 0, lng: 0 },
    );

    return {
      lat: total.lat / projectsWithCoordinates.length,
      lng: total.lng / projectsWithCoordinates.length,
    };
  }, [projectsWithCoordinates]);

  const [center, setCenter] = useState<LatLng>(initialCenter);
  const [query, setQuery] = useState("");
  const [searchLabel, setSearchLabel] = useState("Johor Bahru area");
  const [searchState, setSearchState] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (projectsWithCoordinates.length === 0) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setCenter(initialCenter);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [initialCenter, projectsWithCoordinates.length]);

  const pinnedProjects = useMemo(() => {
    return projectsWithCoordinates
      .map((project) => {
        const distanceKm = haversineDistanceKm(center, project.coordinates);
        return {
          project,
          distanceKm,
        };
      })
      .sort((left, right) => left.distanceKm - right.distanceKm);
  }, [center, projectsWithCoordinates]);

  const markerIcon = useMemo(
    () =>
      divIcon({
        className: "",
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [0, -9],
        html: '<div style="width:18px;height:18px;border-radius:9999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 10px 20px rgba(37,99,235,0.35);"></div>',
      }),
    [],
  );

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!query.trim()) {
      setCenter(initialCenter);
      setSearchLabel("Johor Bahru area");
      setSearchState("idle");
      return;
    }

    setSearchState("loading");

    try {
      const response = await fetch(`/api/public/geocode?q=${encodeURIComponent(query.trim())}`);

      if (!response.ok) {
        throw new Error("Unable to geocode area");
      }

      const data = (await response.json()) as { results: GeocodeResult[] };
      const result = data.results[0];

      if (!result) {
        throw new Error("No area match found");
      }

      setCenter({ lat: Number(result.lat), lng: Number(result.lon) });
      setSearchLabel(result.display_name);
      setSearchState("idle");
    } catch {
      setSearchState("error");
    }
  }

  function jumpToProject(project: PublicProjectCard & { coordinates: LatLng }) {
    setCenter(project.coordinates);
    setSearchLabel(project.displayName ?? project.name);
    setSearchState("idle");
  }

  return (
    <section className="overflow-hidden rounded-[2.25rem] border border-blue-100 bg-background shadow-[0_24px_70px_-40px_rgba(15,23,42,0.5)]">
      <div className="border-b border-blue-100 bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_65%,#eef5ff_100%)] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-700/70">
              Interactive map
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Search an area, then drag to explore nearby projects
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Low-cost map view powered by OpenStreetMap. Search a place, then see all project pins on the map or drag to inspect a different area.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.14em] text-blue-700">
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2">
              {projectsWithCoordinates.length} mapped projects
            </span>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2">
              {pinnedProjects.length} pinned projects
            </span>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2">
              {searchLabel}
            </span>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <label className="relative block">
            <span className="sr-only">Search area</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search area, city, or landmark"
              className="h-12 w-full rounded-2xl border border-border bg-background pl-11 pr-4 text-sm font-semibold outline-none transition placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-foreground px-5 text-sm font-black text-background transition hover:opacity-90"
          >
            <Radar className="size-4" />
            {searchState === "loading" ? "Searching" : "Search area"}
          </button>
        </form>

        {searchState === "error" ? (
          <p className="mt-3 text-sm font-semibold text-rose-600">
            Could not find that area. Try a nearby city or landmark.
          </p>
        ) : null}
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="min-h-[520px] bg-slate-100">
          <MapContainer
            center={[center.lat, center.lng]}
            zoom={12}
            scrollWheelZoom
            className="h-[520px] w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapSync center={center} />
            <MapDragSync onCenterChange={setCenter} />
            {pinnedProjects.map(({ project, distanceKm }) => (
              <Marker
                key={project.id}
                position={[project.coordinates.lat, project.coordinates.lng]}
                icon={markerIcon}
              >
                <Popup
                  className="public-project-popup"
                  closeButton={false}
                  autoPan={false}
                  autoPanPadding={[24, 24]}
                  minWidth={220}
                  maxWidth={252}
                >
                  <div className="w-[228px] overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.55)]">
                    <div className="h-1 bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-500" />

                    <div className="space-y-3 p-3">
                      <div className="flex items-start gap-3">
                        {project.mediaUrl ? (
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                            <Image
                              src={project.mediaUrl}
                              alt={project.mediaCaption ?? project.displayName ?? project.name}
                              fill
                              unoptimized
                              sizes="56px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-50 to-slate-100 ring-1 ring-slate-200">
                            <MapPinned className="size-5 text-blue-500" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="min-w-0 flex-1 text-sm font-black tracking-tight text-slate-950">
                              {project.displayName ?? project.name}
                            </p>

                            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.16em] text-blue-700 ring-1 ring-blue-100">
                              {distanceKm.toFixed(1)} km
                            </span>
                          </div>

                          <p className="mt-1 line-clamp-2 text-[0.72rem] font-medium leading-5 text-slate-500">
                            {project.areaName ?? project.regionName ?? "Location updating soon"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                          <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-slate-500">
                            Available
                          </p>
                          <p className="mt-1 text-sm font-black text-slate-900">
                            {project.availableUnitCount}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                          <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-slate-500">
                            Layouts
                          </p>
                          <p className="mt-1 text-sm font-black text-slate-900">
                            {project.layoutCount}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-end justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-slate-500">
                            From
                          </p>
                          <p className="mt-0.5 truncate text-base font-black tracking-tight text-blue-700">
                            {project.minPrice ?? "Contact us"}
                          </p>
                        </div>

                        <Link
                          href={`/projects/${project.slug}`}
                          className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-slate-950 px-3 text-[0.68rem] font-black text-white transition hover:bg-blue-700"
                        >
                          View
                          <Navigation2 className="size-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <aside className="border-t border-blue-100 bg-white p-5 lg:border-l lg:border-t-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700/70">
                Pinned projects
              </p>
              <h3 className="mt-2 text-xl font-black tracking-tight text-foreground">
                Projects shown as map pins
              </h3>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
              <LocateFixed className="size-4" />
              Pin view
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {pinnedProjects.length > 0 ? (
              pinnedProjects.map(({ project, distanceKm }) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => jumpToProject(project)}
                  className="w-full rounded-2xl border border-border bg-muted/40 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/60"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-black text-foreground">
                        {project.displayName ?? project.name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {project.areaName ?? project.regionName ?? "Location updating soon"}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700 shadow-sm">
                      {distanceKm.toFixed(1)} km away
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 text-sm font-semibold text-muted-foreground">
                    <span>{project.availableUnitCount} available units</span>
                    <span className="font-black text-blue-700">{project.minPrice ?? "Price on request"}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-center text-sm font-semibold text-muted-foreground">
                No mapped projects available yet.
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}