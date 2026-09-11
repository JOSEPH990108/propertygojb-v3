import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { ExpandableImage } from "@/components/common/expandable-image";

export type ProjectAvailabilityRow = {
  id: string;
  unitType: string;
  builtUpSqft: string;
  landAreaSqft: string | null;
  guidePrice: ReactNode;
  status: string;
};

export type ProjectPositionGroup = {
  label: string;
  count: number;
};

type ProjectAvailabilitySectionProps = {
  eyebrow: string;
  description: string;
  sitePlanUrl: string;
  sitePlanIsFallback: boolean;
  totalUnitsLabel: string;
  positions: ProjectPositionGroup[];
  rows: ProjectAvailabilityRow[];
  enquireHref: string;
};

/** "Availability" — real site plan + per-position unit counts + a real per-layout availability table. */
export function ProjectAvailabilitySection({
  eyebrow,
  description,
  sitePlanUrl,
  sitePlanIsFallback,
  totalUnitsLabel,
  positions,
  rows,
  enquireHref,
}: ProjectAvailabilitySectionProps) {
  const showLandColumn = rows.some((row) => row.landAreaSqft);

  return (
    <section
      id="availability"
      className="flex min-h-screen flex-col justify-center bg-muted px-4 py-24 text-foreground sm:px-6 lg:px-8 lg:py-36"
    >
      <div className="mx-auto max-w-7xl">
        <p className="text-[10px] font-semibold tracking-[0.3em] text-public-decorative uppercase">
          {eyebrow}
        </p>
        <div className="mt-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <h2 className="font-serif text-5xl leading-[0.9] tracking-tight sm:text-7xl">
            Find your
            <br />
            <em className="text-public-decorative not-italic">place here.</em>
          </h2>
          <p className="max-w-xs text-sm leading-7 text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="overflow-hidden border border-border bg-card p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] tracking-[0.2em] text-public-decorative uppercase">
                Site plan
                {sitePlanIsFallback ? " (illustrative)" : ""}
              </span>
              <span className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                {totalUnitsLabel}
              </span>
            </div>
            <div className="relative h-[280px] w-full sm:h-[380px]">
              <ExpandableImage
                src={sitePlanUrl}
                alt={
                  sitePlanIsFallback
                    ? "Illustrative site plan — sample layout"
                    : "Project site plan"
                }
                className="absolute inset-0 block cursor-zoom-in"
                imgClassName="size-full object-contain"
              />
            </div>
          </div>

          {positions.length > 0 ? (
            <div className="border border-border bg-card p-6">
              <p className="text-[10px] tracking-[0.2em] text-public-decorative uppercase">
                Available collection
              </p>
              <h3 className="mt-5 font-serif text-4xl leading-none">
                Choose your
                <br />
                <em className="not-italic">position.</em>
              </h3>
              <div className="mt-8 space-y-3">
                {positions.map((position) => (
                  <div
                    key={position.label}
                    className="flex items-center justify-between border-t border-border pt-4 text-xs"
                  >
                    <span>{position.label}</span>
                    <strong className="font-normal">
                      {position.count} unit{position.count === 1 ? "" : "s"}
                    </strong>
                  </div>
                ))}
              </div>
              <a
                href={enquireHref}
                className="mt-8 flex w-full items-center justify-between border-t border-border pt-5 text-[10px] tracking-[0.2em] uppercase"
              >
                Request availability
                <ArrowRight className="size-4 text-public-decorative" />
              </a>
            </div>
          ) : null}
        </div>

        {rows.length > 0 ? (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="border-b border-border text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                <tr>
                  <th className="pb-4 font-normal">Unit type</th>
                  <th className="pb-4 font-normal">Built-up</th>
                  {showLandColumn ? (
                    <th className="pb-4 font-normal">Land</th>
                  ) : null}
                  <th className="pb-4 font-normal">Guide price</th>
                  <th className="pb-4 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border">
                    <td className="py-5 font-serif text-lg">{row.unitType}</td>
                    <td className="py-5 text-muted-foreground">
                      {row.builtUpSqft}
                    </td>
                    {showLandColumn ? (
                      <td className="py-5 text-muted-foreground">
                        {row.landAreaSqft ?? "\u2014"}
                      </td>
                    ) : null}
                    <td className="py-5 text-muted-foreground">
                      {row.guidePrice}
                    </td>
                    <td className="py-5 text-muted-foreground">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}
