"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ExpandableImage } from "@/components/common/expandable-image";
import type { FallbackLayoutGroup } from "@/lib/public/fallback-media";

import { buildLayoutSpecItems, ProjectSpecBar } from "./project-specs";

export type ProjectLayoutOption = {
  id: string;
  code: string;
  name: string | null;
  builtUpSqft: string;
  bedrooms: number;
  bathrooms: number;
  studyRooms: number;
  /** A layout's own real floor plan, when uploaded — shown as a single image, no floor toggle. */
  floorPlanUrl: string | null;
  /**
   * Illustrative pair used only when this layout has no floor plan of its
   * own — always a matched ground + first/second-floor set from the SAME
   * design, never one image mixed with another design's image.
   */
  fallbackGroup: FallbackLayoutGroup;
};

type ProjectLayoutsSectionProps = {
  eyebrow: string;
  heading: string;
  accentHeading: string;
  description: string;
  layouts: ProjectLayoutOption[];
};

type FloorView = "ground" | "upper";

/**
 * "Layouts" — a floor-plan viewer with a clickable list of the
 * project's real layout types (adapted from the reference's single-house
 * "floor levels" viewer, since PropertyGoJB projects have multiple distinct
 * unit-type layouts rather than one house's floor-by-floor breakdown). When a
 * layout has no real floor plan, its illustrative pair is browsable via a
 * ground / first-and-second-floor carousel instead of one static image.
 */
export function ProjectLayoutsSection({
  eyebrow,
  heading,
  accentHeading,
  description,
  layouts,
}: ProjectLayoutsSectionProps) {
  const [selectedId, setSelectedId] = useState(layouts[0]?.id ?? "");
  const [floorView, setFloorView] = useState<FloorView>("ground");
  const selected =
    layouts.find((layout) => layout.id === selectedId) ?? layouts[0];

  if (!selected) {
    return null;
  }

  const isFallback = !selected.floorPlanUrl;
  const floorPlanUrl = selected.floorPlanUrl
    ? selected.floorPlanUrl
    : floorView === "ground"
      ? selected.fallbackGroup.groundFloorImage
      : selected.fallbackGroup.upperFloorImage;

  function selectLayout(id: string) {
    setSelectedId(id);
    setFloorView("ground");
  }

  function toggleFloorView() {
    setFloorView((current) => (current === "ground" ? "upper" : "ground"));
  }

  return (
    <section
      id="layouts"
      className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-24 sm:px-6 lg:px-8 lg:py-36"
    >
      <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.3em] text-public-decorative uppercase">
            {eyebrow}
          </p>
          <h2 className="mt-8 font-serif text-5xl leading-[0.9] tracking-tight sm:text-7xl">
            {heading}
            <br />
            <em className="text-public-decorative not-italic">
              {accentHeading}
            </em>
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-7 text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="mt-16 grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <div>
          <div className="relative min-h-[390px] overflow-hidden border border-border bg-background p-4">
            <ExpandableImage
              src={floorPlanUrl}
              alt={
                isFallback
                  ? `Illustrative ${selected.fallbackGroup.label} — ${floorView === "ground" ? "ground floor" : "first & second floor"} sample`
                  : `${selected.code} floor plan`
              }
              className="absolute inset-0 block cursor-zoom-in text-left"
              imgClassName="size-full object-contain p-4"
            >
              {isFallback ? (
                <span className="pointer-events-none absolute right-4 bottom-4 text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
                  Illustrative
                </span>
              ) : null}
            </ExpandableImage>
          </div>

          {isFallback ? (
            <div className="mt-3 flex items-center justify-between border border-border bg-card px-4 py-3">
              <button
                type="button"
                onClick={toggleFloorView}
                aria-label="Previous floor"
                className="text-public-decorative"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-[10px] font-semibold tracking-[0.2em] text-foreground uppercase">
                {selected.fallbackGroup.label}
                {"\u2014"}
                {floorView === "ground"
                  ? "Ground floor"
                  : "First & second floor"}
              </span>
              <button
                type="button"
                onClick={toggleFloorView}
                aria-label="Next floor"
                className="text-public-decorative"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          {layouts.map((layout, index) => {
            const active = layout.id === selectedId;
            const specs = buildLayoutSpecItems(layout);

            return (
              <button
                key={layout.id}
                type="button"
                onClick={() => selectLayout(layout.id)}
                className={`w-full border p-5 text-left transition ${
                  active ? "border-public-decorative bg-muted" : "border-border"
                }`}
              >
                <span className="text-[10px] tracking-[0.2em] text-public-decorative uppercase">
                  {String(index + 1).padStart(2, "0")} / {layout.code}
                </span>
                <strong className="mt-3 block font-serif text-xl font-normal text-foreground">
                  {layout.name ?? layout.code}
                </strong>
                <ProjectSpecBar specs={specs} className="mt-3" />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
