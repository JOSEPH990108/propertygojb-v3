import Link from "next/link";
import { ArrowRight, Building2, Sparkles } from "lucide-react";

import { AppReveal } from "@/components/common/app-reveal";
import { PublicProjectCard } from "@/components/public/public-project-card";
import { PublicProjectsFilters } from "@/components/public/public-projects-filters";
import {
  buildPublicProjectFilterOptions,
  filterPublicProjects,
  getPublicProjectCatalog,
} from "@/lib/public/projects";
import { buildPublicPageMetadata } from "@/lib/public/seo";

type ProjectsPageProps = {
  searchParams?: Promise<{
    q?: string;
    regionId?: string;
    areaId?: string;
    statusId?: string;
    propertyTypeId?: string;
  }>;
};

export const metadata = buildPublicPageMetadata({
  title: "Projects",
  description:
    "Browse all published PropertyGoJB projects with search and location filters.",
  path: "/projects",
  socialTitle: "PropertyGoJB Projects",
});

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = searchParams ? await searchParams : {};
  const catalog = await getPublicProjectCatalog();
  const filteredProjects = filterPublicProjects(catalog, {
    q: params.q,
    regionId: params.regionId,
    areaId: params.areaId,
    statusId: params.statusId,
    propertyTypeId: params.propertyTypeId,
  });
  const { regionOptions, areaOptions, statusOptions, propertyTypeOptions } =
    buildPublicProjectFilterOptions(catalog);

  return (
    <div className="bg-muted/40">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.32),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-100">
            PropertyGoJB
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Explore published projects in Johor Bahru
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
            Search by project name, location, status, or type, then open each project for detailed layouts, unit availability, and enquiry options.
          </p>

          <div className="mt-10 flex flex-wrap gap-3 text-sm font-bold text-white/80">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur">
              {catalog.length} published projects
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur">
              {catalog.reduce((sum, project) => sum + project.availableUnitCount, 0)} available units
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur">
              {catalog.filter((project) => project.isHotDeal).length} hot deals
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PublicProjectsFilters
          filters={{
            q: params.q ?? "",
            regionId: params.regionId ?? "",
            areaId: params.areaId ?? "",
            statusId: params.statusId ?? "",
            propertyTypeId: params.propertyTypeId ?? "",
          }}
          regionOptions={regionOptions}
          areaOptions={areaOptions}
          statusOptions={statusOptions}
          propertyTypeOptions={propertyTypeOptions}
        />

        <AppReveal className="mt-8 flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Available Projects
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Showing {filteredProjects.length} project{filteredProjects.length === 1 ? "" : "s"} matching your filters.
            </p>
          </div>

          <div className="hidden items-center gap-2 text-sm font-black text-blue-700 md:inline-flex">
            <Sparkles className="size-4" />
            Live database results
          </div>
        </AppReveal>

        {filteredProjects.length === 0 ? (
          <AppReveal className="mt-8 rounded-[2rem] border border-dashed border-border bg-background p-12 text-center shadow-sm">
            <Building2 className="mx-auto size-10 text-muted-foreground/50" />
            <h3 className="mt-4 text-xl font-black text-foreground">
              No projects match the current filters
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Clear the filters or try a different location and project type.
            </p>
          </AppReveal>
        ) : (
          <AppReveal delay={0.08} className="mt-8 grid gap-6 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <PublicProjectCard key={project.id} project={project} />
            ))}
          </AppReveal>
        )}

        <div className="mt-10 flex justify-center">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-black text-foreground shadow-sm transition hover:bg-accent"
          >
            Need help choosing a project?
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
