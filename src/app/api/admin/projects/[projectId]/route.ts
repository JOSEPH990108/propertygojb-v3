import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { authorizeApiRoles } from "@/lib/auth/api-guards";
import { revalidatePublicProjectData } from "@/lib/public/project-revalidation";

const optionalId = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    const trimmedValue = value?.trim();
    return trimmedValue ? trimmedValue : null;
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

const updateProjectSchema = z.object({
  displayName: z.string().trim().min(2).max(200),
  legalName: optionalText(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(150)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Slug must use lowercase letters, numbers, and hyphens only.",
    }),
  developerId: z.string().min(1),
  propertyCategoryId: optionalId,
  propertyTypeId: optionalId,
  projectStatusId: optionalId,
  tenureTypeId: z.string().min(1),
  titleTypeId: optionalId,
  regionId: optionalId,
  areaId: optionalId,
  address: optionalText(1000),
  totalUnits: z.coerce.number().int().min(0).max(100000).default(0),
  launchYear: z.coerce.number().int().min(1900).max(2100).nullable().optional(),
  isHotDeal: z.boolean().default(false),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const authorization = await authorizeApiRoles(["ADMIN", "SUPER_ADMIN"]);

    if (!authorization.ok) {
      return errorJson(authorization.message, authorization.status);
    }

    const { projectId } = await context.params;
    const body = await request.json();
    const validated = updateProjectSchema.parse(body);

    const project = await db.query.projects.findFirst({
      where: (table, { eq }) => eq(table.id, projectId),
      columns: {
        id: true,
      },
    });

    if (!project) {
      return errorJson("Project not found.", 404);
    }

    const existingSlug = await db.query.projects.findFirst({
      where: (table, { and, eq, ne }) =>
        and(eq(table.slug, validated.slug), ne(table.id, projectId)),
      columns: {
        id: true,
      },
    });

    if (existingSlug) {
      return errorJson("Project slug is already used.", 409);
    }

    const developer = await db.query.developers.findFirst({
      where: (table, { eq }) => eq(table.id, validated.developerId),
      columns: {
        id: true,
      },
    });

    if (!developer) {
      return errorJson("Developer not found.", 404);
    }

    const tenureType = await db.query.tenureTypes.findFirst({
      where: (table, { eq }) => eq(table.id, validated.tenureTypeId),
      columns: {
        id: true,
      },
    });

    if (!tenureType) {
      return errorJson("Tenure type not found.", 404);
    }

    const propertyTypeId = validated.propertyTypeId;

    if (propertyTypeId) {
      const propertyType = await db.query.propertyTypes.findFirst({
        where: (table, { eq }) => eq(table.id, propertyTypeId),
        columns: {
          id: true,
          categoryId: true,
        },
      });

      if (!propertyType) {
        return errorJson("Property type not found.", 404);
      }

      if (
        validated.propertyCategoryId &&
        propertyType.categoryId !== validated.propertyCategoryId
      ) {
        return errorJson(
          "Property type does not belong to selected property category.",
          400,
        );
      }
    }

    const areaId = validated.areaId;

    if (areaId) {
      const area = await db.query.areas.findFirst({
        where: (table, { eq }) => eq(table.id, areaId),
        columns: {
          id: true,
          regionId: true,
        },
      });

      if (!area) {
        return errorJson("Area not found.", 404);
      }

      if (validated.regionId && area.regionId !== validated.regionId) {
        return errorJson("Area does not belong to selected region.", 400);
      }
    }

    await db
      .update(schema.projects)
      .set({
        name: validated.displayName,
        displayName: validated.displayName,
        legalName: validated.legalName,
        slug: validated.slug,
        developerId: validated.developerId,
        propertyCategoryId: validated.propertyCategoryId,
        propertyTypeId: validated.propertyTypeId,
        projectStatusId: validated.projectStatusId,
        tenureTypeId: validated.tenureTypeId,
        titleTypeId: validated.titleTypeId,
        regionId: validated.regionId,
        areaId: validated.areaId,
        address: validated.address,
        totalUnits: validated.totalUnits,
        launchYear: validated.launchYear ?? null,
        isHotDeal: validated.isHotDeal,
        updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, projectId));

    await revalidatePublicProjectData();

    return okJson({
      projectId,
      slug: validated.slug,
      message: "Project updated successfully.",
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
