import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { ArrowLeft, LayoutTemplate } from "lucide-react";

import { ProjectLayoutManager } from "@/components/admin/projects/project-layout-manager";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { db, schema } from "@/db";

type ProjectLayoutsPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectLayoutsPage({
  params,
}: ProjectLayoutsPageProps) {
  const { projectId } = await params;

  const project = await db.query.projects.findFirst({
    where: (table, { eq }) => eq(table.id, projectId),
    columns: {
      id: true,
      name: true,
      displayName: true,
      slug: true,
    },
  });

  if (!project) {
    notFound();
  }

  const [layoutTypes, layouts] = await Promise.all([
    db
      .select({
        id: schema.layoutTypes.id,
        code: schema.layoutTypes.code,
        name: schema.layoutTypes.name,
      })
      .from(schema.layoutTypes)
      .orderBy(asc(schema.layoutTypes.sortOrder), asc(schema.layoutTypes.name)),

    db
      .select({
        id: schema.projectLayouts.id,
        code: schema.projectLayouts.code,
        name: schema.projectLayouts.name,
        layoutTypeId: schema.projectLayouts.layoutTypeId,
        layoutTypeName: schema.layoutTypes.name,
        builtUpSqft: schema.projectLayouts.builtUpSqft,
        bedrooms: schema.projectLayouts.bedrooms,
        bathrooms: schema.projectLayouts.bathrooms,
        studyRooms: schema.projectLayouts.studyRooms,
        hasBalcony: schema.projectLayouts.hasBalcony,
        hasYard: schema.projectLayouts.hasYard,
        isDualKey: schema.projectLayouts.isDualKey,
        ceilingHeightM: schema.projectLayouts.ceilingHeightM,
        furnishingStatus: schema.projectLayouts.furnishingStatus,
        floorPlanUrl: schema.files.url,
        virtualTourUrl: schema.projectLayouts.virtualTourUrl,
      })
      .from(schema.projectLayouts)
      .leftJoin(schema.layoutTypes, eq(schema.projectLayouts.layoutTypeId, schema.layoutTypes.id))
      .leftJoin(schema.files, eq(schema.projectLayouts.floorPlanFileId, schema.files.id))
      .where(eq(schema.projectLayouts.projectId, projectId))
      .orderBy(asc(schema.projectLayouts.code)),
  ]);

  return (
    <main className="space-y-8 p-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          href={`/admin/projects/${project.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-blue-600"
        >
          <ArrowLeft className="size-4" />
          Back to Project Detail
        </Link>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-3xl bg-blue-100 text-blue-700">
              <LayoutTemplate className="size-6" />
            </span>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
                Project Layouts
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                {project.displayName ?? project.name}
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                /projects/{project.slug}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <AppStatusBadge tone="info">{layouts.length} Layouts</AppStatusBadge>
            <AppStatusBadge tone="success">{layoutTypes.length} Layout Types</AppStatusBadge>
          </div>
        </div>
      </section>

      <ProjectLayoutManager
        projectId={project.id}
        layoutTypes={layoutTypes}
        layouts={layouts}
      />
    </main>
  );
}
