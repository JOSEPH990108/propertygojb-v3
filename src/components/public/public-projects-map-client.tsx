"use client";

import dynamic from "next/dynamic";

import type { PublicProjectCard } from "@/lib/public/projects";

const LeafletProjectsMap = dynamic(
  () =>
    import("@/components/public/public-projects-map").then(
      (module) => module.PublicProjectsMap,
    ),
  { ssr: false },
);

type PublicProjectsMapClientProps = {
  projects: PublicProjectCard[];
};

export function PublicProjectsMap({ projects }: PublicProjectsMapClientProps) {
  return <LeafletProjectsMap projects={projects} />;
}
