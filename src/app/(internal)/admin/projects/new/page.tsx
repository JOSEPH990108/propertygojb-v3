import { asc } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

import { ProjectCreateForm } from "@/components/admin/projects/project-create-form";
import { db, schema } from "@/db";

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

export default async function NewProjectPage() {
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
      .orderBy(asc(schema.projectStatuses.name)),

    db
      .select({
        id: schema.propertyCategories.id,
        name: schema.propertyCategories.name,
        code: schema.propertyCategories.code,
      })
      .from(schema.propertyCategories)
      .orderBy(asc(schema.propertyCategories.name)),

    db
      .select({
        id: schema.propertyTypes.id,
        name: schema.propertyTypes.name,
        code: schema.propertyTypes.code,
        parentId: schema.propertyTypes.categoryId,
      })
      .from(schema.propertyTypes)
      .orderBy(asc(schema.propertyTypes.name)),

    db
      .select({
        id: schema.tenureTypes.id,
        name: schema.tenureTypes.name,
        code: schema.tenureTypes.code,
      })
      .from(schema.tenureTypes)
      .orderBy(asc(schema.tenureTypes.name)),

    db
      .select({
        id: schema.titleTypes.id,
        name: schema.titleTypes.name,
        code: schema.titleTypes.code,
      })
      .from(schema.titleTypes)
      .orderBy(asc(schema.titleTypes.name)),

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
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/admin/projects"
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-600"
            >
              <ArrowLeft className="size-4" />
              Back to Projects
            </Link>

            <p className="mt-5 text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
              Project Management
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Create Project
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Create the base project record. Phases, layouts, media, and nearby
              places will be connected in the next slices.
            </p>
          </div>

          <span className="grid size-14 place-items-center rounded-3xl bg-blue-100 text-blue-700">
            <Plus className="size-6" />
          </span>
        </div>
      </section>

      <ProjectCreateForm
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
