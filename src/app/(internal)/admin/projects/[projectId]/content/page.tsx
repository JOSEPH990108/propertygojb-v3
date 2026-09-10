import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { ArrowLeft, Sparkles } from "lucide-react";

import { ProjectContentManager } from "@/components/admin/projects/project-content-manager";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { db, schema } from "@/db";

type ProjectContentPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function toOption(row: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
  };
}

export default async function ProjectContentPage({
  params,
}: ProjectContentPageProps) {
  const { projectId } = await params;

  const project = await db.query.projects.findFirst({
    where: (table, { eq }) => eq(table.id, projectId),
    columns: {
      id: true,
      name: true,
      displayName: true,
      slug: true,
      metaTitle: true,
      metaDescription: true,
      canonicalUrl: true,
      ogTitle: true,
      ogDescription: true,
      heroVideoUrl: true,
      ogImageFileId: true,
      isPublished: true,
      publishedAt: true,
      highlightsJson: true,
      faqJson: true,
    },
  });

  if (!project) {
    notFound();
  }

  const [amenities, selectedAmenities, tags, selectedTags, nearbyPlaces, mediaItems] =
    await Promise.all([
      db
        .select({
          id: schema.amenities.id,
          name: schema.amenities.name,
          slug: schema.amenities.slug,
          description: schema.amenities.description,
        })
        .from(schema.amenities)
        .orderBy(asc(schema.amenities.name)),

      db
        .select({
          amenityId: schema.projectAmenities.amenityId,
        })
        .from(schema.projectAmenities)
        .where(eq(schema.projectAmenities.projectId, projectId)),

      db
        .select({
          id: schema.tags.id,
          name: schema.tags.name,
          slug: schema.tags.slug,
          description: schema.tags.description,
        })
        .from(schema.tags)
        .orderBy(asc(schema.tags.name)),

      db
        .select({
          tagId: schema.projectTags.tagId,
        })
        .from(schema.projectTags)
        .where(eq(schema.projectTags.projectId, projectId)),

      db
        .select({
          id: schema.projectNearbyPlaces.id,
          name: schema.projectNearbyPlaces.name,
          category: schema.projectNearbyPlaces.category,
          distanceKm: schema.projectNearbyPlaces.distanceKm,
          sortOrder: schema.projectNearbyPlaces.sortOrder,
        })
        .from(schema.projectNearbyPlaces)
        .where(eq(schema.projectNearbyPlaces.projectId, projectId))
        .orderBy(
          asc(schema.projectNearbyPlaces.sortOrder),
          asc(schema.projectNearbyPlaces.name),
        ),

      db
        .select({
          fileId: schema.projectMedia.fileId,
          url: schema.files.url,
          key: schema.files.key,
          caption: schema.projectMedia.caption,
        })
        .from(schema.projectMedia)
        .innerJoin(schema.files, eq(schema.projectMedia.fileId, schema.files.id))
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
              <Sparkles className="size-6" />
            </span>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
                Project Content
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
            <AppStatusBadge tone="info">
              {selectedAmenities.length} Amenities
            </AppStatusBadge>
            <AppStatusBadge tone="success">{selectedTags.length} Tags</AppStatusBadge>
            <AppStatusBadge tone="warning">
              {nearbyPlaces.length} Nearby
            </AppStatusBadge>
          </div>
        </div>
      </section>

      <ProjectContentManager
        projectId={project.id}
        currentTime={new Date().toISOString()}
        marketingContent={{
          metaTitle: project.metaTitle,
          metaDescription: project.metaDescription,
          canonicalUrl: project.canonicalUrl,
          ogTitle: project.ogTitle,
          ogDescription: project.ogDescription,
          heroVideoUrl: project.heroVideoUrl,
          ogImageFileId: project.ogImageFileId,
          isPublished: project.isPublished,
          publishedAt: project.publishedAt?.toISOString() ?? null,
          highlights: Array.isArray(project.highlightsJson)
            ? project.highlightsJson.filter((item): item is string => typeof item === "string")
            : [],
          faqs: Array.isArray(project.faqJson)
            ? project.faqJson.filter(
                (item): item is { question: string; answer: string } =>
                  Boolean(
                    item &&
                      typeof item === "object" &&
                      "question" in item &&
                      typeof item.question === "string" &&
                      "answer" in item &&
                      typeof item.answer === "string",
                  ),
              )
            : [],
        }}
        mediaItems={mediaItems.map((item) => ({
          fileId: item.fileId,
          url: item.url ?? item.key,
          caption: item.caption,
        }))}
        amenities={amenities.map(toOption)}
        selectedAmenityIds={selectedAmenities.map((item) => item.amenityId)}
        tags={tags.map(toOption)}
        selectedTagIds={selectedTags.map((item) => item.tagId)}
        nearbyPlaces={nearbyPlaces}
      />
    </main>
  );
}
