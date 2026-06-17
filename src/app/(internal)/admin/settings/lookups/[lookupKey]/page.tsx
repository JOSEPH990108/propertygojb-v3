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

type SimpleLookupTable = typeof schema.projectStatuses;

export default async function LookupDetailPage({
  params,
}: LookupDetailPageProps) {
  const { lookupKey } = await params;
  const config = getSimpleLookupConfig(lookupKey);

  if (!config) {
    notFound();
  }

  const table = config.table as SimpleLookupTable;

  const items = await db
    .select({
      id: table.id,
      code: table.code,
      name: table.name,
      description: table.description,
      color: table.color,
      icon: table.icon,
      sortOrder: table.sortOrder,
      isActive: table.isActive,
    })
    .from(table)
    .orderBy(asc(table.sortOrder), asc(table.name));

  const activeCount = items.filter((item) => item.isActive).length;

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
            <AppStatusBadge tone="info">{items.length} Total</AppStatusBadge>
            <AppStatusBadge tone="success">{activeCount} Active</AppStatusBadge>
          </div>
        </div>
      </section>

      <LookupEditor lookupKey={lookupKey} items={items} />
    </main>
  );
}
