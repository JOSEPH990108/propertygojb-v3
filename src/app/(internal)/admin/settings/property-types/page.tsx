import Link from "next/link";
import { asc } from "drizzle-orm";
import { ArrowLeft, FolderKanban } from "lucide-react";

import { PropertyClassificationManager } from "@/components/admin/settings/property-classification-manager";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { db, schema } from "@/db";

export default async function PropertyTypesPage() {
  const [categories, propertyTypes] = await Promise.all([
    db
      .select({
        id: schema.propertyCategories.id,
        code: schema.propertyCategories.code,
        name: schema.propertyCategories.name,
        description: schema.propertyCategories.description,
        sortOrder: schema.propertyCategories.sortOrder,
        isActive: schema.propertyCategories.isActive,
      })
      .from(schema.propertyCategories)
      .orderBy(asc(schema.propertyCategories.sortOrder), asc(schema.propertyCategories.name)),

    db
      .select({
        id: schema.propertyTypes.id,
        categoryId: schema.propertyTypes.categoryId,
        code: schema.propertyTypes.code,
        name: schema.propertyTypes.name,
        description: schema.propertyTypes.description,
        sortOrder: schema.propertyTypes.sortOrder,
        isActive: schema.propertyTypes.isActive,
      })
      .from(schema.propertyTypes)
      .orderBy(asc(schema.propertyTypes.sortOrder), asc(schema.propertyTypes.name)),
  ]);

  return (
    <main className="space-y-8 p-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-2 text-sm font-bold text-blue-600"
        >
          <ArrowLeft className="size-4" />
          Back to Settings
        </Link>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-3xl bg-blue-100 text-blue-700">
              <FolderKanban className="size-6" />
            </span>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
                Settings
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Property Classification
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage parent-child property structure. Project forms will filter
                property type based on the selected property category.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <AppStatusBadge tone="info">{categories.length} Categories</AppStatusBadge>
            <AppStatusBadge tone="success">{propertyTypes.length} Types</AppStatusBadge>
          </div>
        </div>
      </section>

      <PropertyClassificationManager
        categories={categories}
        propertyTypes={propertyTypes}
      />
    </main>
  );
}
