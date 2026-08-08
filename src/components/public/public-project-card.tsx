import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, MapPin, Ruler } from "lucide-react";

import type { PublicProjectCard as PublicProjectCardData } from "@/lib/public/projects";
import { cn } from "@/lib/utils";

type PublicProjectCardProps = {
  project: PublicProjectCardData;
  className?: string;
};

export function PublicProjectCard({ project, className }: PublicProjectCardProps) {
  const projectName = project.displayName ?? project.name;
  const location =
    [project.areaName, project.regionName].filter(Boolean).join(", ") ||
    "Location updating soon";
  const imageUrl = project.mediaUrl;

  return (
    <Link
      href={`/projects/${project.slug}`}
      className={cn(
        "group overflow-hidden rounded-[2rem] border border-border bg-card text-card-foreground shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)]",
        className,
      )}
    >
      <div className="relative h-60 bg-slate-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={project.mediaCaption ?? projectName}
            fill
            unoptimized
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100">
            <Building2 className="size-14 text-blue-200" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {project.isHotDeal ? (
            <span className="rounded-full bg-rose-600 px-3 py-1 text-xs font-black uppercase tracking-wide text-white shadow-lg">
              Hot Deal
            </span>
          ) : null}

          {project.projectStatusName ? (
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-wide text-white backdrop-blur">
              {project.projectStatusName}
            </span>
          ) : null}
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4 text-white">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/75">
              From
            </p>
            <p className="mt-1 text-2xl font-black tracking-tight">
              {project.minPrice ?? "Contact us"}
            </p>
          </div>

          <span className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white/15 px-4 text-sm font-black backdrop-blur transition group-hover:bg-blue-600">
            View
            <ArrowRight className="size-4 transition group-hover:translate-x-1" />
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-black tracking-tight text-card-foreground">
              {projectName}
            </h3>

            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              {project.developerName ?? "Developer updating soon"}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-blue-600" />
            <span className="min-w-0 truncate">{location}</span>
          </div>

          <div className="flex items-center gap-2">
            <Ruler className="size-4 shrink-0 text-blue-600" />
            <span className="min-w-0 truncate">
              {project.propertyTypeName ?? "Property type updating soon"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Building2 className="size-4 shrink-0 text-blue-600" />
            <span className="min-w-0 truncate">
              {project.layoutCount || 0} layouts · {project.availableUnitCount || 0} available units
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
