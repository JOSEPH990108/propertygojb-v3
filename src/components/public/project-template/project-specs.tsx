import type { LucideIcon } from "lucide-react";
import { Bath, BedDouble, BookOpen, Ruler } from "lucide-react";

import { cn } from "@/lib/utils";

export type ProjectSpecItem = {
  key: string;
  icon: LucideIcon;
  label: string;
  value: string;
};

type LayoutLike = {
  id: string;
  builtUpSqft: string;
  bedrooms: number;
  bathrooms: number;
  studyRooms: number;
};

function parseSqft(value: string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

/** Per-layout spec chips (sqft, bedrooms, bathrooms, study rooms) for a single layout card. */
export function buildLayoutSpecItems(layout: LayoutLike): ProjectSpecItem[] {
  const specs: ProjectSpecItem[] = [];
  const sqft = parseSqft(layout.builtUpSqft);

  if (sqft) {
    specs.push({
      key: "sqft",
      icon: Ruler,
      label: "Built-up",
      value: `${sqft.toLocaleString("en-MY")} sqft`,
    });
  }

  if (layout.bedrooms > 0) {
    specs.push({
      key: "bedrooms",
      icon: BedDouble,
      label: "Bedrooms",
      value: `${layout.bedrooms} Bed${layout.bedrooms > 1 ? "s" : ""}`,
    });
  }

  if (layout.bathrooms > 0) {
    specs.push({
      key: "bathrooms",
      icon: Bath,
      label: "Bathrooms",
      value: `${layout.bathrooms} Bath${layout.bathrooms > 1 ? "s" : ""}`,
    });
  }

  if (layout.studyRooms > 0) {
    specs.push({
      key: "study",
      icon: BookOpen,
      label: "Study rooms",
      value: `${layout.studyRooms} Study`,
    });
  }

  return specs;
}

type ProjectSpecBarProps = {
  specs: ProjectSpecItem[];
  className?: string;
};

/** Icon + label row used by the layouts viewer's layout-type list. */
export function ProjectSpecBar({ specs, className }: ProjectSpecBarProps) {
  if (specs.length === 0) {
    return null;
  }

  return (
    <dl className={cn("flex flex-wrap gap-x-4 gap-y-2", className)}>
      {specs.map((spec) => {
        const Icon = spec.icon;

        return (
          <div key={spec.key} className="flex items-center gap-1.5">
            <Icon
              aria-hidden="true"
              className="size-3.5 shrink-0 text-public-decorative"
            />
            <div className="leading-tight">
              <dt className="sr-only">{spec.label}</dt>
              <dd className="text-xs text-muted-foreground">{spec.value}</dd>
            </div>
          </div>
        );
      })}
    </dl>
  );
}
