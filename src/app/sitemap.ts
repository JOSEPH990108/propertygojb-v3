import type { MetadataRoute } from "next";

import { getPublicUrl } from "@/config/public-site";
import { getPublicProjectCatalog } from "@/lib/public/projects";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getPublicProjectCatalog();
  const staticPages: MetadataRoute.Sitemap = [
    { url: getPublicUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: getPublicUrl("/projects"), changeFrequency: "daily", priority: 0.9 },
    { url: getPublicUrl("/about"), changeFrequency: "monthly", priority: 0.7 },
    {
      url: getPublicUrl("/contact"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    { url: getPublicUrl("/privacy"), changeFrequency: "yearly", priority: 0.3 },
    { url: getPublicUrl("/terms"), changeFrequency: "yearly", priority: 0.3 },
  ];

  return [
    ...staticPages,
    ...projects.map((project) => ({
      url: getPublicUrl(`/projects/${project.slug}`),
      changeFrequency: "weekly" as const,
      priority: project.isHotDeal ? 0.9 : 0.8,
      images: project.ogImageUrl ? [project.ogImageUrl] : undefined,
    })),
  ];
}
