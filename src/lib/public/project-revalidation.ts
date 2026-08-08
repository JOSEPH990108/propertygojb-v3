import "server-only";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

import { publishPublicProjectsUpdate } from "@/lib/realtime/public-projects";

export const PUBLIC_PROJECTS_VERSION_TAG = "public-projects-version";

const getCachedPublicProjectsVersion = unstable_cache(
  async () => crypto.randomUUID(),
  ["public-projects-version"],
  {
    tags: [PUBLIC_PROJECTS_VERSION_TAG],
    revalidate: false,
  },
);

export async function getPublicProjectsVersion() {
  return getCachedPublicProjectsVersion();
}

export async function revalidatePublicProjectData() {
  revalidateTag(PUBLIC_PROJECTS_VERSION_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/book-viewing");
  revalidatePath("/contact");
  revalidatePath("/projects");
  revalidatePath("/projects/[slug]", "page");

  await publishPublicProjectsUpdate();
}