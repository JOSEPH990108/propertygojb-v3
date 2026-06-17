import Link from "next/link";
import { notFound } from "next/navigation";
import { asc } from "drizzle-orm";
import { ArrowLeft, Building2, Images, LayoutTemplate } from "lucide-react";

import { ProjectEditForm } from "@/components/admin/projects/project-edit-form";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { db, schema } from "@/db";

type ProjectDetailPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function toOption(row: {
  id: string;
  name: string | null;
  code?: string | null;
  parentId?: string | null;
}) {
  return {
    id: row.id,
    name: row.name ?? row.code ?? row.id,
    code: row.code ?? null,
    parentId: row.parentId ?? null,
  };
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { projectId } = await params;

  const project = await db.query.projects.findFirst({
    where: (table, { eq }) => eq(table.id, projectId),
    columns: {
      id: true,
      name: true,
      displayName: true,
      legalName: true,
      slug: true,
      developerId: true,
      propertyCategoryId: true,
      propertyTypeId: true,
      projectStatusId: true,
      tenureTypeId: true,
      titleTypeId: true,
      regionId: true,
      areaId: true,
      address: true,
      totalUnits: true,
      launchYear: true,
      isHotDeal: true,
      isPublished: true,
      updatedAt: true,
    },
  });

  if (!project) {
    notFound();
  }

  const [
    developers,
    projectStatuses,
    propertyCategories,
    propertyTypes,
    tenureTypes,
    titleTypes,
    regions,
    areas,
  ] = await Promise.all([
    db
      .select({
        id: schema.developers.id,
        name: schema.developers.legalName,
      })
      .from(schema.developers)
      .orderBy(asc(schema.developers.legalName)),

    db
      .select({
        id: schema.projectStatuses.id,
        name: schema.projectStatuses.name,
        code: schema.projectStatuses.code,
      })
      .from(schema.projectStatuses)
      .orderBy(asc(schema.projectStatuses.sortOrder), asc(schema.projectStatuses.name)),

    db
      .select({
        id: schema.propertyCategories.id,
        name: schema.propertyCategories.name,
        code: schema.propertyCategories.code,
      })
      .from(schema.propertyCategories)
      .orderBy(asc(schema.propertyCategories.sortOrder), asc(schema.propertyCategories.name)),

    db
      .select({
        id: schema.propertyTypes.id,
        name: schema.propertyTypes.name,
        code: schema.propertyTypes.code,
        parentId: schema.propertyTypes.categoryId,
      })
      .from(schema.propertyTypes)
      .orderBy(asc(schema.propertyTypes.sortOrder), asc(schema.propertyTypes.name)),

    db
      .select({
        id: schema.tenureTypes.id,
        name: schema.tenureTypes.name,
        code: schema.tenureTypes.code,
      })
      .from(schema.tenureTypes)
      .orderBy(asc(schema.tenureTypes.sortOrder), asc(schema.tenureTypes.name)),

    db
      .select({
        id: schema.titleTypes.id,
        name: schema.titleTypes.name,
        code: schema.titleTypes.code,
      })
      .from(schema.titleTypes)
      .orderBy(asc(schema.titleTypes.sortOrder), asc(schema.titleTypes.name)),

    db
      .select({
        id: schema.regions.id,
        name: schema.regions.name,
      })
      .from(schema.regions)
      .orderBy(asc(schema.regions.name)),

    db
      .select({
        id: schema.areas.id,
        name: schema.areas.name,
        parentId: schema.areas.regionId,
      })
      .from(schema.areas)
      .orderBy(asc(schema.areas.name)),
  ]);

  return (
    <main className="space-y-8 p-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-2 text-sm font-bold text-blue-600"
        >
          <ArrowLeft className="size-4" />
          Back to Projects
        </Link>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-3xl bg-blue-100 text-blue-700">
              <Building2 className="size-6" />
            </span>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
                Project Detail
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                {project.displayName ?? project.name}
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                /projects/{project.slug}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/projects/${project.id}/media`}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
            >
              <Images className="size-4" />
              Manage Media
            </Link>

            <Link
              href={`/admin/projects/${project.id}/layouts`}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 text-sm font-bold text-purple-700 transition hover:bg-purple-100"
            >
              <LayoutTemplate className="size-4" />
              Manage Layouts
            </Link>

            <AppStatusBadge tone={project.isPublished ? "success" : "warning"}>
              {project.isPublished ? "Published" : "Draft"}
            </AppStatusBadge>

            {project.isHotDeal ? (
              <AppStatusBadge tone="danger">Hot Deal</AppStatusBadge>
            ) : null}
          </div>
        </div>
      </section>

      <ProjectEditForm
        project={{
          ...project,
          displayName: project.displayName ?? project.name,
          totalUnits: project.totalUnits ?? 0,
        }}
        developers={developers.map(toOption)}
        projectStatuses={projectStatuses.map(toOption)}
        propertyCategories={propertyCategories.map(toOption)}
        propertyTypes={propertyTypes.map(toOption)}
        tenureTypes={tenureTypes.map(toOption)}
        titleTypes={titleTypes.map(toOption)}
        regions={regions.map(toOption)}
        areas={areas.map(toOption)}
      />
    </main>
  );
}
