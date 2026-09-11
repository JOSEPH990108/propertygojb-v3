import { notFound, permanentRedirect } from "next/navigation";
import { getPublicProjectBySlug } from "@/lib/public/projects";

export default async function ShortProjectAliasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getPublicProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  permanentRedirect(`/projects/${project.project.slug}`);
}
