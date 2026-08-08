import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { PublicHighRiseAvailability } from "@/components/public/public-high-rise-availability";
import { getPublicProjectBySlug } from "@/lib/public/projects";

const supportedSlugs = new Set([
  "elmora-condominium",
  "sunway-lakehills",
  "sunway-lakehills-phase-1",
]);

export default async function ProjectAvailabilityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!supportedSlugs.has(slug)) {
    notFound();
  }

  const detail = await getPublicProjectBySlug(slug);

  if (!detail) {
    notFound();
  }

  return (
    <div className="bg-[#f4f7fb]">
      <div className="mx-auto max-w-[96rem] px-4 pt-6 sm:px-6 lg:px-8">
        <Link
          href={`/projects/${slug}`}
          className="inline-flex items-center gap-2 text-sm font-black text-blue-700 transition hover:text-blue-900"
        >
          <ArrowLeft className="size-4" />
          Back to {detail.project.displayName ?? detail.project.name}
        </Link>
      </div>
      <PublicHighRiseAvailability
        projectName={detail.project.displayName ?? detail.project.name}
        units={detail.units}
        layouts={detail.layouts}
        availabilityPlans={detail.availabilityPlans}
      />
    </div>
  );
}