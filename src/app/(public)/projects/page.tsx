import Image from "next/image";
import Link from "next/link";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { ArrowRight, Building2, Home, MapPin, Sparkles } from "lucide-react";

import { db, schema } from "@/db";

function formatPrice(value: string | null | undefined) {
  if (!value) {
    return "Contact for price";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "Contact for price";
  }

  return `From RM ${amount.toLocaleString("en-MY", {
    maximumFractionDigits: 0,
  })}`;
}

function getMinPrice(
  units: {
    projectId: string;
    basePrice: string;
    finalPrice: string | null;
  }[],
  projectId: string,
) {
  const prices = units
    .filter((unit) => unit.projectId === projectId)
    .map((unit) => Number(unit.finalPrice ?? unit.basePrice))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (prices.length === 0) {
    return null;
  }

  return String(Math.min(...prices));
}

export default async function ProjectsPage() {
  const projects = await db
    .select({
      id: schema.projects.id,
      slug: schema.projects.slug,
      name: schema.projects.name,
      displayName: schema.projects.displayName,
      totalUnits: schema.projects.totalUnits,
      isHotDeal: schema.projects.isHotDeal,
      developerName: schema.developers.legalName,
      propertyTypeName: schema.propertyTypes.name,
      tenureName: schema.tenureTypes.name,
      regionName: schema.regions.name,
      areaName: schema.areas.name,
    })
    .from(schema.projects)
    .innerJoin(schema.developers, eq(schema.projects.developerId, schema.developers.id))
    .leftJoin(schema.propertyTypes, eq(schema.projects.propertyTypeId, schema.propertyTypes.id))
    .leftJoin(schema.tenureTypes, eq(schema.projects.tenureTypeId, schema.tenureTypes.id))
    .leftJoin(schema.regions, eq(schema.projects.regionId, schema.regions.id))
    .leftJoin(schema.areas, eq(schema.projects.areaId, schema.areas.id))
    .where(
      and(
        eq(schema.projects.isPublished, true),
        isNull(schema.projects.deletedAt),
      ),
    )
    .orderBy(asc(schema.projects.name));

  const projectIds = projects.map((project) => project.id);

  const [mediaItems, units] =
    projectIds.length > 0
      ? await Promise.all([
          db
            .select({
              projectId: schema.projectMedia.projectId,
              url: schema.files.url,
              key: schema.files.key,
              caption: schema.projectMedia.caption,
            })
            .from(schema.projectMedia)
            .innerJoin(schema.files, eq(schema.projectMedia.fileId, schema.files.id))
            .where(inArray(schema.projectMedia.projectId, projectIds))
            .orderBy(asc(schema.projectMedia.sortOrder), asc(schema.projectMedia.createdAt)),

          db
            .select({
              projectId: schema.units.projectId,
              basePrice: schema.units.basePrice,
              finalPrice: schema.units.finalPrice,
            })
            .from(schema.units)
            .where(inArray(schema.units.projectId, projectIds)),
        ])
      : [[], []];

  const firstMediaByProject = new Map<string, (typeof mediaItems)[number]>();

  for (const media of mediaItems) {
    if (!firstMediaByProject.has(media.projectId)) {
      firstMediaByProject.set(media.projectId, media);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-900 to-blue-600 px-6 py-20 text-white">
        <div className="absolute -right-20 -top-20 size-80 rounded-full bg-white/10 blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-100">
            PropertyGoJB
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Explore New Launch Projects in Johor Bahru
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
            Browse available projects, layouts, unit prices, and project details
            directly from the live database.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Available Projects
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Showing published projects only.
            </p>
          </div>

          <span className="inline-flex w-fit rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 ring-1 ring-blue-100">
            {projects.length} Project(s)
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <Sparkles className="mx-auto size-10 text-slate-300" />
            <h3 className="mt-4 text-xl font-black text-slate-950">
              Projects updating soon
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Publish a project from Admin Project Detail to show it here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {projects.map((project) => {
              const media = firstMediaByProject.get(project.id);
              const imageUrl = media?.url ?? media?.key ?? null;
              const minPrice = getMinPrice(units, project.id);
              const projectName = project.displayName ?? project.name;
              const location =
                [project.areaName, project.regionName].filter(Boolean).join(", ") ||
                "Location updating soon";

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.slug}`}
                  className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
                >
                  <div className="relative h-56 bg-slate-100">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={media?.caption ?? projectName}
                        fill
                        unoptimized
                        sizes="(min-width: 1024px) 33vw, 100vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
                        <Building2 className="size-14 text-blue-200" />
                      </div>
                    )}

                    {project.isHotDeal ? (
                      <span className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-wide text-white shadow-lg">
                        Hot Deal
                      </span>
                    ) : null}
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-black tracking-tight text-slate-950">
                      {projectName}
                    </h3>

                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      {project.developerName ?? "Developer updating soon"}
                    </p>

                    <div className="mt-5 space-y-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-blue-600" />
                        <span>{location}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Home className="size-4 text-blue-600" />
                        <span>
                          {project.propertyTypeName ?? "Property type updating soon"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Building2 className="size-4 text-blue-600" />
                        <span>
                          {project.tenureName ?? "Tenure updating soon"} ·{" "}
                          {project.totalUnits || 0} units
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-lg font-black text-blue-700">
                        {formatPrice(minPrice)}
                      </p>

                      <span className="inline-flex items-center gap-2 text-sm font-black text-slate-950 transition group-hover:text-blue-700">
                        View Details
                        <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
