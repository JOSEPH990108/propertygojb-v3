import "server-only";

import { and, asc, desc, eq, ilike, isNull, or } from "drizzle-orm";

import { db, schema } from "@/db";

type GetPropertyInventoryOptions = {
  search?: string;
  projectId?: string;
  bookingStatusId?: string;
  lotTypeId?: string;
};

export async function getPropertyInventory({
  search = "",
  projectId = "",
  bookingStatusId = "",
  lotTypeId = "",
}: GetPropertyInventoryOptions = {}) {
  const searchValue = search.trim();
  const searchPattern = `%${searchValue}%`;

  const units = await db
    .select({
      unitId: schema.units.id,
      unitNo: schema.units.unitNo,
      floor: schema.units.floor,
      stack: schema.units.stack,
      streetName: schema.units.streetName,
      builtUpSqft: schema.units.builtUpSqft,
      landAreaSqft: schema.units.landAreaSqft,
      dimensionText: schema.units.dimensionText,
      facing: schema.unitFacings.name,
      carparkCount: schema.units.carparkCount,
      basePrice: schema.units.basePrice,
      finalPrice: schema.units.finalPrice,
      createdAt: schema.units.createdAt,

      projectId: schema.projects.id,
      projectSlug: schema.projects.slug,
      projectName: schema.projects.name,
      projectDisplayName: schema.projects.displayName,
      projectTotalUnits: schema.projects.totalUnits,
      isPublished: schema.projects.isPublished,

      layoutId: schema.projectLayouts.id,
      layoutCode: schema.projectLayouts.code,
      layoutName: schema.projectLayouts.name,
      bedrooms: schema.projectLayouts.bedrooms,
      bathrooms: schema.projectLayouts.bathrooms,

      bookingStatusId: schema.bookingStatuses.id,
      bookingStatusCode: schema.bookingStatuses.code,
      bookingStatusName: schema.bookingStatuses.name,
      bookingStatusColor: schema.bookingStatuses.color,

      lotTypeId: schema.lotTypes.id,
      lotTypeCode: schema.lotTypes.code,
      lotTypeName: schema.lotTypes.name,
    })
    .from(schema.units)
    .innerJoin(schema.projects, eq(schema.units.projectId, schema.projects.id))
    .leftJoin(schema.projectLayouts, eq(schema.units.layoutId, schema.projectLayouts.id))
    .leftJoin(schema.unitFacings, eq(schema.units.facingTypeId, schema.unitFacings.id))
    .innerJoin(schema.bookingStatuses, eq(schema.units.bookingStatusId, schema.bookingStatuses.id))
    .innerJoin(schema.lotTypes, eq(schema.units.lotTypeId, schema.lotTypes.id))
    .where(
      and(
        isNull(schema.units.deletedAt),
        isNull(schema.projects.deletedAt),
        projectId ? eq(schema.projects.id, projectId) : undefined,
        bookingStatusId
          ? eq(schema.bookingStatuses.id, bookingStatusId)
          : undefined,
        lotTypeId ? eq(schema.lotTypes.id, lotTypeId) : undefined,
        searchValue
          ? or(
              ilike(schema.units.unitNo, searchPattern),
              ilike(schema.projects.name, searchPattern),
              ilike(schema.projects.displayName, searchPattern),
              ilike(schema.bookingStatuses.name, searchPattern),
              ilike(schema.bookingStatuses.code, searchPattern),
              ilike(schema.lotTypes.name, searchPattern),
              ilike(schema.projectLayouts.code, searchPattern),
              ilike(schema.projectLayouts.name, searchPattern),
            )
          : undefined,
      ),
    )
    .orderBy(
      asc(schema.projects.name),
      asc(schema.units.displaySequence),
      asc(schema.units.unitNo),
    )
    .limit(300);

  const projectMap = new Map<
    string,
    {
      projectId: string;
      projectName: string;
      projectDisplayName: string | null;
      projectSlug: string;
      isPublished: boolean;
      totalUnitsDeclared: number;
      units: typeof units;
    }
  >();

  for (const unit of units) {
    const existing = projectMap.get(unit.projectId);

    if (existing) {
      existing.units.push(unit);
      continue;
    }

    projectMap.set(unit.projectId, {
      projectId: unit.projectId,
      projectName: unit.projectName,
      projectDisplayName: unit.projectDisplayName,
      projectSlug: unit.projectSlug,
      isPublished: unit.isPublished,
      totalUnitsDeclared: unit.projectTotalUnits,
      units: [unit],
    });
  }

  const projects = Array.from(projectMap.values()).sort(
    (a, b) => b.units.length - a.units.length,
  );

  const availableUnits = units.filter((unit) =>
    ["AVAILABLE", "READY", "OPEN"].includes(unit.bookingStatusCode),
  ).length;

  const reservedUnits = units.filter((unit) =>
    ["RESERVED", "BOOKED", "PENDING"].includes(unit.bookingStatusCode),
  ).length;

  const soldUnits = units.filter((unit) =>
    ["SOLD", "COMPLETED"].includes(unit.bookingStatusCode),
  ).length;

  const latestUnits = [...units]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8);

  return {
    projects,
    units,
    latestUnits,
    metrics: {
      totalProjects: projects.length,
      totalUnits: units.length,
      availableUnits,
      reservedUnits,
      soldUnits,
    },
  };
}

export type PropertyInventory = Awaited<ReturnType<typeof getPropertyInventory>>;

export async function getPropertyUnitDetailById(unitId: string) {
  const rows = await db
    .select({
      unitId: schema.units.id,
      unitNo: schema.units.unitNo,
      floor: schema.units.floor,
      stack: schema.units.stack,
      streetName: schema.units.streetName,
      builtUpSqft: schema.units.builtUpSqft,
      landAreaSqft: schema.units.landAreaSqft,
      dimensionText: schema.units.dimensionText,
      facing: schema.unitFacings.name,
      carparkCount: schema.units.carparkCount,
      basePrice: schema.units.basePrice,
      finalPrice: schema.units.finalPrice,
      createdAt: schema.units.createdAt,
      updatedAt: schema.units.updatedAt,

      projectId: schema.projects.id,
      projectSlug: schema.projects.slug,
      projectName: schema.projects.name,
      projectDisplayName: schema.projects.displayName,
      projectTotalUnits: schema.projects.totalUnits,
      isPublished: schema.projects.isPublished,

      layoutId: schema.projectLayouts.id,
      layoutCode: schema.projectLayouts.code,
      layoutName: schema.projectLayouts.name,
      bedrooms: schema.projectLayouts.bedrooms,
      bathrooms: schema.projectLayouts.bathrooms,

      bookingStatusId: schema.bookingStatuses.id,
      bookingStatusCode: schema.bookingStatuses.code,
      bookingStatusName: schema.bookingStatuses.name,
      bookingStatusColor: schema.bookingStatuses.color,

      lotTypeId: schema.lotTypes.id,
      lotTypeCode: schema.lotTypes.code,
      lotTypeName: schema.lotTypes.name,
    })
    .from(schema.units)
    .innerJoin(schema.projects, eq(schema.units.projectId, schema.projects.id))
    .leftJoin(schema.projectLayouts, eq(schema.units.layoutId, schema.projectLayouts.id))
    .leftJoin(schema.unitFacings, eq(schema.units.facingTypeId, schema.unitFacings.id))
    .innerJoin(schema.bookingStatuses, eq(schema.units.bookingStatusId, schema.bookingStatuses.id))
    .innerJoin(schema.lotTypes, eq(schema.units.lotTypeId, schema.lotTypes.id))
    .where(
      and(
        eq(schema.units.id, unitId),
        isNull(schema.units.deletedAt),
        isNull(schema.projects.deletedAt),
      ),
    )
    .limit(1);

  const unit = rows[0];

  if (!unit) {
    return null;
  }

  const relatedBookings = await db
    .select({
      bookingId: schema.bookings.id,
      bookingCode: schema.bookings.bookingCode,
      status: schema.bookings.status,
      bookingFeeAmount: schema.bookings.bookingFeeAmount,
      bookingFeeCurrency: schema.bookings.bookingFeeCurrency,
      bookingFeePaidAmount: schema.bookings.bookingFeePaidAmount,
      createdAt: schema.bookings.createdAt,
      customerName: schema.leads.fullName,
      customerPhone: schema.leads.primaryPhoneE164,
    })
    .from(schema.bookingUnits)
    .innerJoin(schema.bookings, eq(schema.bookingUnits.bookingId, schema.bookings.id))
    .leftJoin(schema.leads, eq(schema.bookings.leadId, schema.leads.id))
    .where(
      and(
        eq(schema.bookingUnits.unitId, unitId),
        isNull(schema.bookings.deletedAt),
      ),
    )
    .orderBy(desc(schema.bookings.createdAt))
    .limit(10);

  return {
    unit,
    relatedBookings,
  };
}

export type PropertyUnitDetail = Awaited<
  ReturnType<typeof getPropertyUnitDetailById>
>;

export async function getBookingStatusOptions() {
  return db
    .select({
      id: schema.bookingStatuses.id,
      code: schema.bookingStatuses.code,
      name: schema.bookingStatuses.name,
      color: schema.bookingStatuses.color,
    })
    .from(schema.bookingStatuses)
    .orderBy(asc(schema.bookingStatuses.name));
}

export async function getPropertyInventoryFilterOptions() {
  const [projects, bookingStatuses, lotTypes] = await Promise.all([
    db
      .select({
        id: schema.projects.id,
        name: schema.projects.name,
        displayName: schema.projects.displayName,
        slug: schema.projects.slug,
      })
      .from(schema.projects)
      .where(isNull(schema.projects.deletedAt))
      .orderBy(asc(schema.projects.name)),

    db
      .select({
        id: schema.bookingStatuses.id,
        code: schema.bookingStatuses.code,
        name: schema.bookingStatuses.name,
        color: schema.bookingStatuses.color,
      })
      .from(schema.bookingStatuses)
      .orderBy(asc(schema.bookingStatuses.name)),

    db
      .select({
        id: schema.lotTypes.id,
        code: schema.lotTypes.code,
        name: schema.lotTypes.name,
      })
      .from(schema.lotTypes)
      .orderBy(asc(schema.lotTypes.name)),
  ]);

  return {
    projects,
    bookingStatuses,
    lotTypes,
  };
}

export type PropertyInventoryFilterOptions = Awaited<
  ReturnType<typeof getPropertyInventoryFilterOptions>
>;

