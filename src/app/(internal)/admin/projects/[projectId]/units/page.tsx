import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { ArrowLeft, Home } from "lucide-react";

import { ProjectUnitManager } from "@/components/admin/projects/project-unit-manager";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { db, schema } from "@/db";

type ProjectUnitsPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function toOption(row: {
  id: string;
  name: string | null;
  code?: string | null;
}) {
  return {
    id: row.id,
    name: row.name ?? row.code ?? row.id,
    code: row.code ?? null,
  };
}

export default async function ProjectUnitsPage({ params }: ProjectUnitsPageProps) {
  const { projectId } = await params;

  const project = await db.query.projects.findFirst({
    where: (table, { eq }) => eq(table.id, projectId),
    columns: {
      id: true,
      name: true,
      displayName: true,
      slug: true,
    },
  });

  if (!project) {
    notFound();
  }

  const [layouts, lotTypes, bookingStatuses, unitPositions, units] =
    await Promise.all([
      db
        .select({
          id: schema.projectLayouts.id,
          name: schema.projectLayouts.name,
          code: schema.projectLayouts.code,
        })
        .from(schema.projectLayouts)
        .where(eq(schema.projectLayouts.projectId, projectId))
        .orderBy(asc(schema.projectLayouts.code)),

      db
        .select({
          id: schema.lotTypes.id,
          name: schema.lotTypes.name,
          code: schema.lotTypes.code,
        })
        .from(schema.lotTypes)
        .orderBy(asc(schema.lotTypes.sortOrder), asc(schema.lotTypes.name)),

      db
        .select({
          id: schema.bookingStatuses.id,
          name: schema.bookingStatuses.name,
          code: schema.bookingStatuses.code,
        })
        .from(schema.bookingStatuses)
        .orderBy(asc(schema.bookingStatuses.sortOrder), asc(schema.bookingStatuses.name)),

      db
        .select({
          id: schema.unitPositions.id,
          name: schema.unitPositions.name,
          code: schema.unitPositions.code,
        })
        .from(schema.unitPositions)
        .orderBy(asc(schema.unitPositions.sortOrder), asc(schema.unitPositions.name)),

      db
        .select({
          id: schema.units.id,
          layoutId: schema.units.layoutId,
          layoutName: schema.projectLayouts.name,
          unitNo: schema.units.unitNo,
          floor: schema.units.floor,
          stack: schema.units.stack,
          streetName: schema.units.streetName,
          displaySequence: schema.units.displaySequence,
          builtUpSqft: schema.units.builtUpSqft,
          landAreaSqft: schema.units.landAreaSqft,
          dimensionText: schema.units.dimensionText,
          facing: schema.units.facing,
          positionTypeId: schema.units.positionTypeId,
          positionTypeName: schema.unitPositions.name,
          carparkCount: schema.units.carparkCount,
          carparkLotNo: schema.units.carparkLotNo,
          carparkType: schema.units.carparkType,
          lotTypeId: schema.units.lotTypeId,
          lotTypeName: schema.lotTypes.name,
          bookingStatusId: schema.units.bookingStatusId,
          bookingStatusName: schema.bookingStatuses.name,
          basePrice: schema.units.basePrice,
          finalPrice: schema.units.finalPrice,
        })
        .from(schema.units)
        .leftJoin(schema.projectLayouts, eq(schema.units.layoutId, schema.projectLayouts.id))
        .leftJoin(schema.unitPositions, eq(schema.units.positionTypeId, schema.unitPositions.id))
        .leftJoin(schema.lotTypes, eq(schema.units.lotTypeId, schema.lotTypes.id))
        .leftJoin(schema.bookingStatuses, eq(schema.units.bookingStatusId, schema.bookingStatuses.id))
        .where(eq(schema.units.projectId, projectId))
        .orderBy(asc(schema.units.displaySequence), asc(schema.units.unitNo)),
    ]);

  return (
    <main className="space-y-8 p-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          href={`/admin/projects/${project.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-blue-600"
        >
          <ArrowLeft className="size-4" />
          Back to Project Detail
        </Link>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-3xl bg-blue-100 text-blue-700">
              <Home className="size-6" />
            </span>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
                Unit Inventory
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                {project.displayName ?? project.name}
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                /projects/{project.slug}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <AppStatusBadge tone="info">{units.length} Units</AppStatusBadge>
            <AppStatusBadge tone="success">{layouts.length} Layouts</AppStatusBadge>
          </div>
        </div>
      </section>

      <ProjectUnitManager
        projectId={project.id}
        layouts={layouts.map(toOption)}
        lotTypes={lotTypes.map(toOption)}
        bookingStatuses={bookingStatuses.map(toOption)}
        unitPositions={unitPositions.map(toOption)}
        units={units}
      />
    </main>
  );
}
