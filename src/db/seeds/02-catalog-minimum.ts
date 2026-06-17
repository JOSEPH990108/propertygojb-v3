// src\db\seeds\02-catalog-minimum.ts
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import * as schema from "../schema";

type DB = PostgresJsDatabase<typeof schema>;

export async function seedCatalogMinimum(db: DB) {
  const [insertedDeveloper] = await db
    .insert(schema.developers)
    .values({
      slug: "demo-developer",
      name: "Demo Developer",
      legalName: "Demo Developer Sdn Bhd",
    })
    .onConflictDoNothing()
    .returning();

  const propertyCategory = await db.query.propertyCategories.findFirst({
    where: (table, { eq }) => eq(table.code, "HIGH_RISE"),
  });
  const propertyType = await db.query.propertyTypes.findFirst({
    where: (table, { eq }) => eq(table.code, "CONDO"),
  });
  const projectStatus = await db.query.projectStatuses.findFirst({
    where: (table, { eq }) => eq(table.code, "NEW_LAUNCH"),
  });
  const tenureType = await db.query.tenureTypes.findFirst({
    where: (table, { eq }) => eq(table.code, "FREEHOLD"),
  });
  const bookingStatus = await db.query.bookingStatuses.findFirst({
    where: (table, { eq }) => eq(table.code, "AVAILABLE"),
  });
  const lotType = await db.query.lotTypes.findFirst({
    where: (table, { eq }) => eq(table.code, "NON_BUMIPUTERA"),
  });

  if (
    !propertyCategory ||
    !projectStatus ||
    !tenureType ||
    !bookingStatus ||
    !lotType
  ) {
    return;
  }

  const region = await db.query.regions.findFirst();
  const area = await db.query.areas.findFirst();
  const existingDeveloper = insertedDeveloper
    ? insertedDeveloper
    : await db.query.developers.findFirst({
        where: (table, { eq }) => eq(table.slug, "demo-developer"),
      });

  if (!existingDeveloper) {
    return;
  }

  const [insertedProject] = await db
    .insert(schema.projects)
    .values({
      slug: "demo-project",
      name: "Demo Project",
      developerId: existingDeveloper.id,
      propertyCategoryId: propertyCategory.id,
      propertyTypeId: propertyType?.id,
      projectStatusId: projectStatus.id,
      tenureTypeId: tenureType.id,
      regionId: region?.id,
      areaId: area?.id,
      totalUnits: 100,
    })
    .onConflictDoNothing()
    .returning();

  const project = insertedProject
    ? insertedProject
    : await db.query.projects.findFirst({
        where: (table, { eq }) => eq(table.slug, "demo-project"),
      });

  if (!project) {
    return;
  }

  const [insertedPhase] = await db
    .insert(schema.projectPhases)
    .values({
      projectId: project.id,
      name: "Phase 1",
      phaseCode: "P1",
    })
    .onConflictDoNothing()
    .returning();

  const phase = insertedPhase
    ? insertedPhase
    : await db.query.projectPhases.findFirst({
        where: (table, { and: andOp, eq }) =>
          andOp(eq(table.projectId, project.id), eq(table.name, "Phase 1")),
      });

  if (!phase) {
    return;
  }

  const [insertedTower] = await db
    .insert(schema.projectTowers)
    .values({
      projectId: project.id,
      phaseId: phase.id,
      towerNumber: "A",
      name: "Tower A",
      floorCount: 30,
    })
    .onConflictDoNothing()
    .returning();

  const tower = insertedTower
    ? insertedTower
    : await db.query.projectTowers.findFirst({
        where: (table, { and: andOp, eq }) =>
          andOp(eq(table.projectId, project.id), eq(table.towerNumber, "A")),
      });

  if (!tower) {
    return;
  }

  const [insertedLayout] = await db
    .insert(schema.projectLayouts)
    .values({
      projectId: project.id,
      code: "A1",
      name: "Type A1",
      builtUpSqft: "850",
      bedrooms: sql`3`,
      bathrooms: sql`2`,
    })
    .onConflictDoNothing()
    .returning();

  const layout = insertedLayout
    ? insertedLayout
    : await db.query.projectLayouts.findFirst({
        where: (table, { and: andOp, eq }) =>
          andOp(eq(table.projectId, project.id), eq(table.code, "A1")),
      });

  if (!layout) {
    return;
  }

  const existingUnit = await db.query.units.findFirst({
    where: (table, { and: andOp, eq }) =>
      andOp(eq(table.projectId, project.id), eq(table.unitNo, "A-10-01")),
  });

  if (existingUnit) {
    return;
  }

  await db
    .insert(schema.units)
    .values({
      projectId: project.id,
      phaseId: phase.id,
      towerId: tower.id,
      layoutId: layout.id,
      unitNo: "A-10-01",
      floor: sql`10`,
      stack: "01",
      lotTypeId: lotType.id,
      bookingStatusId: bookingStatus.id,
      basePrice: "500000",
    })
    .onConflictDoNothing();
}
