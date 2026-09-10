import Link from "next/link";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Flame,
  FolderKanban,
  Home,
  MapPin,
  Plus,
} from "lucide-react";

import { AppSearchInput } from "@/components/common/app-search-input";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { db, schema } from "@/db";

type AdminProjectsPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

function formatDate(value: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getStatusTone(statusCode?: string | null) {
  switch (statusCode) {
    case "ACTIVE":
    case "OPEN":
    case "SELLING":
    case "LAUNCHED":
      return "success";
    case "COMING_SOON":
    case "DRAFT":
      return "warning";
    case "SOLD_OUT":
    case "CLOSED":
      return "neutral";
    default:
      return "info";
  }
}

export default async function AdminProjectsPage({
  searchParams,
}: AdminProjectsPageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";

  const searchCondition = query
    ? or(
        ilike(schema.projects.displayName, `%${query}%`),
        ilike(schema.projects.legalName, `%${query}%`),
        ilike(schema.projects.slug, `%${query}%`),
        ilike(schema.projects.address, `%${query}%`),
        ilike(schema.developers.legalName, `%${query}%`),
        ilike(schema.regions.name, `%${query}%`),
        ilike(schema.areas.name, `%${query}%`),
      )
    : undefined;

  const projects = await db
    .select({
      id: schema.projects.id,
      slug: schema.projects.slug,
      displayName: schema.projects.displayName,
      legalName: schema.projects.legalName,
      address: schema.projects.address,
      totalUnits: schema.projects.totalUnits,
      launchYear: schema.projects.launchYear,
      isPublished: schema.projects.isPublished,
      isHotDeal: schema.projects.isHotDeal,
      createdAt: schema.projects.createdAt,
      developerName: schema.developers.legalName,
      statusCode: schema.projectStatuses.code,
      statusName: schema.projectStatuses.name,
      propertyTypeName: schema.propertyTypes.name,
      regionName: schema.regions.name,
      areaName: schema.areas.name,
    })
    .from(schema.projects)
    .leftJoin(
      schema.developers,
      eq(schema.projects.developerId, schema.developers.id),
    )
    .leftJoin(
      schema.projectStatuses,
      eq(schema.projects.projectStatusId, schema.projectStatuses.id),
    )
    .leftJoin(
      schema.propertyTypes,
      eq(schema.projects.propertyTypeId, schema.propertyTypes.id),
    )
    .leftJoin(schema.regions, eq(schema.projects.regionId, schema.regions.id))
    .leftJoin(schema.areas, eq(schema.projects.areaId, schema.areas.id))
    .where(searchCondition ? and(searchCondition) : undefined)
    .orderBy(desc(schema.projects.createdAt))
    .limit(50);

  const publishedCount = projects.filter((project) => project.isPublished).length;
  const hotDealCount = projects.filter((project) => project.isHotDeal).length;
  const totalUnits = projects.reduce(
    (sum, project) => sum + (project.totalUnits ?? 0),
    0,
  );

  return (
    <main className="space-y-8 p-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
              Catalog Module
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Project Management
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage property projects, visibility, location, launch status, and
              project catalog data.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <AppSearchInput
              initialValue={query}
              placeholder="Search project, slug, area..."
              className="w-full sm:w-[360px]"
            />

            <Link
              href="/admin/projects/new"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus className="size-4" />
              New Project
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-100 text-blue-700">
                <FolderKanban className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Showing Projects
                </p>
                <p className="text-2xl font-black text-slate-950">
                  {projects.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                <Eye className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Published
                </p>
                <p className="text-2xl font-black text-slate-950">
                  {publishedCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-orange-100 text-orange-700">
                <Flame className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Hot Deals / Units
                </p>
                <p className="text-2xl font-black text-slate-950">
                  {hotDealCount} / {totalUnits}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold">Project</th>
                <th className="px-6 py-4 font-bold">Developer</th>
                <th className="px-6 py-4 font-bold">Location</th>
                <th className="px-6 py-4 text-center font-bold">Status</th>
                <th className="px-6 py-4 text-center font-bold">Visibility</th>
                <th className="px-6 py-4 text-center font-bold">Units</th>
                <th className="px-6 py-4 font-bold">Created</th>
                <th className="px-6 py-4 text-right font-bold">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {projects.map((project) => {
                const projectName =
                  project.displayName ?? project.legalName ?? project.slug;
                const location = [project.areaName, project.regionName]
                  .filter(Boolean)
                  .join(", ");

                return (
                  <tr key={project.id} className="transition hover:bg-slate-50/80">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="grid size-11 place-items-center rounded-2xl bg-blue-100 text-blue-700">
                          <Home className="size-5" />
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="max-w-[280px] truncate font-black text-slate-950">
                              {projectName}
                            </p>

                            {project.isHotDeal ? (
                              <AppStatusBadge tone="warning">Hot</AppStatusBadge>
                            ) : null}
                          </div>

                          <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                            /projects/{project.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Building2 className="size-4 text-slate-400" />
                        <span className="max-w-[220px] truncate font-medium">
                          {project.developerName ?? "-"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="max-w-[260px]">
                        <div className="flex items-center gap-2 text-slate-700">
                          <MapPin className="size-4 text-slate-400" />
                          <span className="truncate font-semibold">
                            {location || "-"}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {project.address ?? "-"}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <AppStatusBadge tone={getStatusTone(project.statusCode)}>
                        {project.statusName ?? project.statusCode ?? "No Status"}
                      </AppStatusBadge>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <AppStatusBadge
                        tone={project.isPublished ? "success" : "warning"}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {project.isPublished ? (
                            <Eye className="size-3.5" />
                          ) : (
                            <EyeOff className="size-3.5" />
                          )}
                          {project.isPublished ? "Published" : "Draft"}
                        </span>
                      </AppStatusBadge>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <p className="font-black text-slate-950">
                        {project.totalUnits ?? 0}
                      </p>
                      <p className="text-xs text-slate-500">
                        {project.launchYear ?? "-"}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-slate-500">
                      {formatDate(project.createdAt)}
                    </td>

                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        View
                        <ArrowRight className="size-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {projects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      No projects found.
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Create your first property project to start the catalog.
                    </p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
