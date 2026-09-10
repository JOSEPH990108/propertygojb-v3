import Image from "next/image";
import Link from "next/link";

import type { PublicProjectCard as PublicProjectCardData } from "@/lib/public/projects";
import { cn } from "@/lib/utils";

type PublicProjectCardProps = {
  project: PublicProjectCardData;
  className?: string;
};

const LANDED_PLACEHOLDER_IMAGE = "/images/defaults/listing-villa.png";
const HIGH_RISE_PLACEHOLDER_IMAGE = "/images/defaults/listing-tower.png";

// Some imported projects carry a generic "Residential" category, so the
// property type name is checked too for common landed type names.
const LANDED_KEYWORDS =
  /landed|terrace|semi[\s-]?d|bungalow|villa|cluster|link house/i;

function getPlaceholderImage(project: PublicProjectCardData) {
  const isLanded = LANDED_KEYWORDS.test(
    `${project.propertyCategoryName ?? ""} ${project.propertyTypeName ?? ""}`,
  );

  return isLanded ? LANDED_PLACEHOLDER_IMAGE : HIGH_RISE_PLACEHOLDER_IMAGE;
}

export function PublicProjectCard({
  project,
  className,
}: PublicProjectCardProps) {
  const projectName = project.displayName ?? project.name;
  const location =
    [project.areaName, project.regionName].filter(Boolean).join(", ") ||
    "Location updating soon";
  const imageUrl = project.mediaUrl;
  const isPlaceholderImage = !imageUrl;

  return (
    <Link
      href={`/projects/${project.slug}`}
      className={cn(
        "group overflow-hidden rounded-none border border-border bg-card text-card-foreground shadow-sm transition duration-300 hover:border-ring hover:shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] motion-safe:hover:-translate-y-1",
        className,
      )}
    >
      <div className="relative aspect-4/3 bg-muted">
        <Image
          src={imageUrl ?? getPlaceholderImage(project)}
          alt={
            imageUrl
              ? (project.mediaCaption ?? projectName)
              : "Illustrative photo — project media not yet available"
          }
          fill
          unoptimized
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 70vw, 85vw"
          className="object-cover transition duration-700 motion-safe:group-hover:scale-105"
        />

        {isPlaceholderImage ? (
          <span className="absolute right-3 bottom-3 text-[0.65rem] font-medium tracking-wide text-white/70 uppercase">
            Illustrative photo
          </span>
        ) : null}

        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {project.isHotDeal ? (
            <span className="rounded-none bg-rose-600 px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase">
              Hot Deal
            </span>
          ) : null}

          {project.propertyTypeName ? (
            <span className="rounded-none bg-white/90 px-3 py-1 text-xs font-semibold tracking-wide text-[#1b1c19] uppercase">
              {project.propertyTypeName}
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-6">
        <h3 className="line-clamp-2 font-serif text-xl font-medium tracking-tight text-card-foreground">
          {projectName}
        </h3>

        <p className="mt-2 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          {location}
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          {project.developerName ?? "Developer updating soon"}
        </p>

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-border pt-4">
          <p className="min-w-0 text-sm text-muted-foreground">
            {project.layoutCount || 0} layouts ·{" "}
            {project.availableUnitCount || 0} available units
          </p>

          <p className="shrink-0 font-serif text-lg font-medium text-card-foreground">
            {project.minPrice ?? "Price on application"}
          </p>
        </div>
      </div>
    </Link>
  );
}
