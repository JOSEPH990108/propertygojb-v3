import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { ArrowLeft, Images } from "lucide-react";

import { ProjectMediaManager } from "@/components/admin/projects/project-media-manager";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { db, schema } from "@/db";

type ProjectMediaPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectMediaPage({ params }: ProjectMediaPageProps) {
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

  const [mediaTypes, mediaItems] = await Promise.all([
    db
      .select({
        id: schema.mediaTypes.id,
        code: schema.mediaTypes.code,
        name: schema.mediaTypes.name,
      })
      .from(schema.mediaTypes)
      .orderBy(asc(schema.mediaTypes.sortOrder), asc(schema.mediaTypes.name)),

    db
      .select({
        id: schema.projectMedia.id,
        fileId: schema.projectMedia.fileId,
        mediaTypeId: schema.projectMedia.mediaTypeId,
        caption: schema.projectMedia.caption,
        sortOrder: schema.projectMedia.sortOrder,
        url: schema.files.url,
        key: schema.files.key,
        mimeType: schema.files.mimeType,
        mediaTypeName: schema.mediaTypes.name,
      })
      .from(schema.projectMedia)
      .innerJoin(schema.files, eq(schema.projectMedia.fileId, schema.files.id))
      .leftJoin(
        schema.mediaTypes,
        eq(schema.projectMedia.mediaTypeId, schema.mediaTypes.id),
      )
      .where(eq(schema.projectMedia.projectId, projectId))
      .orderBy(asc(schema.projectMedia.sortOrder), asc(schema.projectMedia.createdAt)),
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
              <Images className="size-6" />
            </span>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
                Project Media
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
            <AppStatusBadge tone="info">{mediaItems.length} Media</AppStatusBadge>
            <AppStatusBadge tone="success">
              {mediaTypes.length} Media Types
            </AppStatusBadge>
          </div>
        </div>
      </section>

      <ProjectMediaManager
        projectId={project.id}
        mediaTypes={mediaTypes}
        mediaItems={mediaItems}
      />
    </main>
  );
}
