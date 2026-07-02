import Link from "next/link";
import { notFound } from "next/navigation";
import { asc } from "drizzle-orm";
import { ArrowLeft, Database } from "lucide-react";

import { LookupEditor } from "@/components/admin/settings/lookup-editor";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { db, schema } from "@/db";
import { getSimpleLookupConfig } from "@/lib/admin/simple-lookups";

type LookupDetailPageProps = {
  params: Promise<{
    lookupKey: string;
  }>;
};

type CodeLookupTable = typeof schema.projectStatuses;
type SlugLookupTable = typeof schema.amenities;

export default async function LookupDetailPage({
  params,
}: LookupDetailPageProps) {
  const { lookupKey } = await params;
  const config = getSimpleLookupConfig(lookupKey);

  if (!config) {
    notFound();
  }

  const items =
    config.kind === "code"
      ? await db
          .select({
            id: (config.table as CodeLookupTable).id,
            code: (config.table as CodeLookupTable).code,
            slug: (config.table as CodeLookupTable).code,
            name: (config.table as CodeLookupTable).name,
            description: (config.table as CodeLookupTable).description,
            color: (config.table as CodeLookupTable).color,
            icon: (config.table as CodeLookupTable).icon,
            sortOrder: (config.table as CodeLookupTable).sortOrder,
            isActive: (config.table as CodeLookupTable).isActive,
            deletedAt: (config.table as CodeLookupTable).deletedAt,
          })
          .from(config.table as CodeLookupTable)
          .orderBy(
            asc((config.table as CodeLookupTable).sortOrder),
            asc((config.table as CodeLookupTable).name),
          )
      : await db
          .select({
            id: (config.table as SlugLookupTable).id,
            code: (config.table as SlugLookupTable).slug,
            slug: (config.table as SlugLookupTable).slug,
            name: (config.table as SlugLookupTable).name,
            description: (config.table as SlugLookupTable).description,
            color: (config.table as SlugLookupTable).slug,
            icon: (config.table as SlugLookupTable).slug,
            sortOrder: (config.table as SlugLookupTable).id,
            isActive: (config.table as SlugLookupTable).isActive,
            deletedAt: (config.table as SlugLookupTable).deletedAt,
          })
          .from(config.table as SlugLookupTable)
          .orderBy(asc((config.table as SlugLookupTable).name));

  const safeItems = items.map((item) => ({
    id: item.id,
    code: item.code,
    slug: item.slug,
    name: item.name,
    description: item.description,
    color: config.kind === "code" ? item.color : null,
    icon: config.kind === "code" ? item.icon : null,
    sortOrder: config.kind === "code" ? Number(item.sortOrder) : 0,
    isActive: item.isActive,
    deletedAt: item.deletedAt ? item.deletedAt.toISOString() : null,
  }));

  const activeCount = safeItems.filter(
    (item) => item.isActive && !item.deletedAt,
  ).length;
  const deletedCount = safeItems.filter((item) => item.deletedAt).length;

  return (
    <main className="space-y-8 p-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          href={config.backHref}
          className="inline-flex items-center gap-2 text-sm font-bold text-blue-600"
        >
          <ArrowLeft className="size-4" />
          Back to Lookup Management
        </Link>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-3xl bg-blue-100 text-blue-700">
              <Database className="size-6" />
            </span>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
                Lookup Group
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                {config.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {config.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <AppStatusBadge tone="info">{safeItems.length} Total</AppStatusBadge>
            <AppStatusBadge tone="success">{activeCount} Active</AppStatusBadge>
            {deletedCount > 0 ? (
              <AppStatusBadge tone="danger">{deletedCount} Deleted</AppStatusBadge>
            ) : null}
          </div>
        </div>
      </section>

      <LookupEditor
        lookupKey={lookupKey}
        kind={config.kind}
        items={safeItems}
      />
    </main>
  );
}
