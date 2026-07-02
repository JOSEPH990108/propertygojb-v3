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

const createProjectSchema = z.object({
  displayName: z.string().trim().min(2, "Project name is required.").max(200),
  legalName: optionalText(200),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required.")
    .max(120)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must use lowercase letters, numbers, and hyphens only.",
    ),
  developerId: z.string().trim().min(1, "Developer is required."),
  propertyCategoryId: optionalId,
  propertyTypeId: optionalId,
  projectStatusId: optionalId,
  tenureTypeId: z.string().trim().min(1, "Tenure type is required."),
  titleTypeId: optionalId,
  regionId: optionalId,
  areaId: optionalId,
  address: optionalText(1000),
  totalUnits: z.number().int().min(0).max(100000).default(0),
  launchYear: z.number().int().min(1900).max(2100).nullable().optional(),
  isHotDeal: z.boolean().default(false),
  isPublished: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/projects/new");

    const body = await request.json();
    const validated = createProjectSchema.parse(body);

    const existingProject = await db.query.projects.findFirst({
      where: (table, { eq }) => eq(table.slug, validated.slug),
      columns: {
        id: true,
      },
    });

    if (existingProject) {
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

    const [createdProject] = await db
      .insert(schema.projects)
      .values({
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
        isPublished: validated.isPublished,
      })
      .returning({
        id: schema.projects.id,
        slug: schema.projects.slug,
      });

    return okJson({
      projectId: createdProject.id,
      slug: createdProject.slug,
      message: "Project created successfully.",
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
