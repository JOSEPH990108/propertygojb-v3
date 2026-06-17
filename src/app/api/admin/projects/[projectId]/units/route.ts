import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";

const optionalId = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    const trimmedValue = value?.trim();

    if (!trimmedValue || trimmedValue === "__none__") {
      return null;
    }

    return trimmedValue;
  });

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => {
      const trimmedValue = value?.trim();
      return trimmedValue ? trimmedValue : null;
    });

const nullableInteger = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? null : Number(value)),
  z.number().int().nullable(),
);

const nullableDecimal = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? null : Number(value)),
  z.number().min(0).nullable(),
);

const unitActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    layoutId: optionalId,
    unitNo: z.string().trim().min(1, "Unit number is required.").max(50),
    floor: nullableInteger,
    stack: optionalText(10),
    streetName: optionalText(100),
    displaySequence: z.coerce.number().int().min(0).max(999999).default(0),
    builtUpSqft: nullableDecimal,
    landAreaSqft: nullableDecimal,
    dimensionText: optionalText(50),
    facing: optionalText(100),
    positionTypeId: optionalId,
    carparkCount: z.coerce.number().int().min(0).max(20).default(1),
    carparkLotNo: optionalText(100),
    carparkType: optionalText(50),
    lotTypeId: z.string().min(1, "Lot type is required."),
    bookingStatusId: z.string().min(1, "Booking status is required."),
    basePrice: z.coerce.number().min(0),
    finalPrice: nullableDecimal,
  }),
  z.object({
    action: z.literal("update"),
    unitId: z.string().min(1, "Unit is required."),
    layoutId: optionalId,
    unitNo: z.string().trim().min(1, "Unit number is required.").max(50),
    floor: nullableInteger,
    stack: optionalText(10),
    streetName: optionalText(100),
    displaySequence: z.coerce.number().int().min(0).max(999999).default(0),
    builtUpSqft: nullableDecimal,
    landAreaSqft: nullableDecimal,
    dimensionText: optionalText(50),
    facing: optionalText(100),
    positionTypeId: optionalId,
    carparkCount: z.coerce.number().int().min(0).max(20).default(1),
    carparkLotNo: optionalText(100),
    carparkType: optionalText(50),
    lotTypeId: z.string().min(1, "Lot type is required."),
    bookingStatusId: z.string().min(1, "Booking status is required."),
    basePrice: z.coerce.number().min(0),
    finalPrice: nullableDecimal,
  }),
  z.object({
    action: z.literal("remove"),
    unitId: z.string().min(1, "Unit is required."),
  }),
]);

async function assertProjectExists(projectId: string) {
  const project = await db.query.projects.findFirst({
    where: (table, { eq }) => eq(table.id, projectId),
    columns: {
      id: true,
    },
  });

  return Boolean(project);
}

async function assertUnitBelongsToProject(projectId: string, unitId: string) {
  const unit = await db.query.units.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.id, unitId), eq(table.projectId, projectId)),
    columns: {
      id: true,
    },
  });

  return Boolean(unit);
}

function toMoney(value: number) {
  return value.toFixed(2);
}

function toOptionalMoney(value: number | null) {
  return value === null ? null : value.toFixed(2);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/projects");

    const { projectId } = await context.params;
    const projectExists = await assertProjectExists(projectId);

    if (!projectExists) {
      return errorJson("Project not found.", 404);
    }

    const body = await request.json();
    const validated = unitActionSchema.parse(body);

    if (validated.action === "remove") {
      const unitExists = await assertUnitBelongsToProject(projectId, validated.unitId);

      if (!unitExists) {
        return errorJson("Unit not found.", 404);
      }

      await db.delete(schema.units).where(eq(schema.units.id, validated.unitId));

      return okJson({
        message: "Unit removed successfully.",
      });
    }

    const duplicate = await db.query.units.findFirst({
      where: (table, { and, eq, ne }) =>
        validated.action === "update"
          ? and(
              eq(table.projectId, projectId),
              eq(table.unitNo, validated.unitNo),
              ne(table.id, validated.unitId),
            )
          : and(eq(table.projectId, projectId), eq(table.unitNo, validated.unitNo)),
      columns: {
        id: true,
      },
    });

    if (duplicate) {
      return errorJson("Unit number is already used in this project.", 409);
    }

    const payload = {
      layoutId: validated.layoutId,
      unitNo: validated.unitNo,
      floor: validated.floor,
      stack: validated.stack,
      streetName: validated.streetName,
      displaySequence: validated.displaySequence,
      builtUpSqft: toOptionalMoney(validated.builtUpSqft),
      landAreaSqft: toOptionalMoney(validated.landAreaSqft),
      dimensionText: validated.dimensionText,
      facing: validated.facing,
      positionTypeId: validated.positionTypeId,
      carparkCount: validated.carparkCount,
      carparkLotNo: validated.carparkLotNo,
      carparkType: validated.carparkType,
      lotTypeId: validated.lotTypeId,
      bookingStatusId: validated.bookingStatusId,
      basePrice: toMoney(validated.basePrice),
      finalPrice: toOptionalMoney(validated.finalPrice),
    };

    if (validated.action === "create") {
      await db.insert(schema.units).values({
        projectId,
        ...payload,
      });

      return okJson({
        message: "Unit created successfully.",
      });
    }

    const unitExists = await assertUnitBelongsToProject(projectId, validated.unitId);

    if (!unitExists) {
      return errorJson("Unit not found.", 404);
    }

    await db
      .update(schema.units)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(schema.units.id, validated.unitId));

    return okJson({
      message: "Unit updated successfully.",
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
