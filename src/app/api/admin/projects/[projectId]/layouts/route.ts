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

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    const trimmedValue = value?.trim();
    return trimmedValue ? trimmedValue : null;
  })
  .pipe(z.string().url().max(1000).nullable());

const layoutActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    code: z.string().trim().min(1).max(50),
    name: optionalText(100),
    layoutTypeId: optionalId,
    builtUpSqft: z.coerce.number().positive().max(100000),
    bedrooms: z.coerce.number().int().min(0).max(50),
    bathrooms: z.coerce.number().int().min(0).max(50),
    studyRooms: z.coerce.number().int().min(0).max(20).default(0),
    hasBalcony: z.boolean().default(false),
    hasYard: z.boolean().default(false),
    isDualKey: z.boolean().default(false),
    ceilingHeightM: z.coerce.number().positive().max(20).nullable().optional(),
    furnishingStatus: z.string().trim().min(1).max(20).default("UNFURNISHED"),
    floorPlanUrl: optionalUrl,
    virtualTourUrl: optionalUrl,
  }),
  z.object({
    action: z.literal("update"),
    layoutId: z.string().min(1),
    code: z.string().trim().min(1).max(50),
    name: optionalText(100),
    layoutTypeId: optionalId,
    builtUpSqft: z.coerce.number().positive().max(100000),
    bedrooms: z.coerce.number().int().min(0).max(50),
    bathrooms: z.coerce.number().int().min(0).max(50),
    studyRooms: z.coerce.number().int().min(0).max(20).default(0),
    hasBalcony: z.boolean().default(false),
    hasYard: z.boolean().default(false),
    isDualKey: z.boolean().default(false),
    ceilingHeightM: z.coerce.number().positive().max(20).nullable().optional(),
    furnishingStatus: z.string().trim().min(1).max(20).default("UNFURNISHED"),
    floorPlanUrl: optionalUrl,
    virtualTourUrl: optionalUrl,
  }),
  z.object({
    action: z.literal("remove"),
    layoutId: z.string().min(1),
  }),
]);

function inferMimeType(url: string) {
  const cleanUrl = url.split("?")[0]?.toLowerCase() ?? "";

  if (cleanUrl.endsWith(".png")) {
    return "image/png";
  }

  if (cleanUrl.endsWith(".webp")) {
    return "image/webp";
  }

  if (cleanUrl.endsWith(".pdf")) {
    return "application/pdf";
  }

  return "image/jpeg";
}

async function assertProjectExists(projectId: string) {
  const project = await db.query.projects.findFirst({
    where: (table, { eq }) => eq(table.id, projectId),
    columns: {
      id: true,
    },
  });

  return Boolean(project);
}

async function assertLayoutBelongsToProject(projectId: string, layoutId: string) {
  const layout = await db.query.projectLayouts.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.id, layoutId), eq(table.projectId, projectId)),
    columns: {
      id: true,
    },
  });

  return Boolean(layout);
}

async function getOrCreateExternalFile(url: string) {
  const existingFile = await db.query.files.findFirst({
    where: (table, { and, eq }) =>
      and(
        eq(table.provider, "external_url"),
        eq(table.bucket, "project-layouts"),
        eq(table.key, url),
      ),
    columns: {
      id: true,
    },
  });

  if (existingFile) {
    return existingFile.id;
  }

  const insertedFiles = await db
    .insert(schema.files)
    .values({
      provider: "external_url",
      bucket: "project-layouts",
      key: url,
      url,
      mimeType: inferMimeType(url),
    })
    .returning({
      id: schema.files.id,
    });

  return insertedFiles[0].id;
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
    const validated = layoutActionSchema.parse(body);

    if (validated.action === "remove") {
      const layoutExists = await assertLayoutBelongsToProject(
        projectId,
        validated.layoutId,
      );

      if (!layoutExists) {
        return errorJson("Project layout not found.", 404);
      }

      await db
        .delete(schema.projectLayouts)
        .where(eq(schema.projectLayouts.id, validated.layoutId));

      return okJson({
        message: "Project layout removed successfully.",
      });
    }

    const duplicate = await db.query.projectLayouts.findFirst({
      where: (table, { and, eq, ne }) =>
        validated.action === "update"
          ? and(
              eq(table.projectId, projectId),
              eq(table.code, validated.code),
              ne(table.id, validated.layoutId),
            )
          : and(eq(table.projectId, projectId), eq(table.code, validated.code)),
      columns: {
        id: true,
      },
    });

    if (duplicate) {
      return errorJson("Layout code is already used in this project.", 409);
    }

    const floorPlanFileId = validated.floorPlanUrl
      ? await getOrCreateExternalFile(validated.floorPlanUrl)
      : null;

    const payload = {
      code: validated.code.toUpperCase().replace(/\s+/g, "_"),
      name: validated.name,
      layoutTypeId: validated.layoutTypeId,
      builtUpSqft: validated.builtUpSqft.toFixed(2),
      bedrooms: validated.bedrooms,
      bathrooms: validated.bathrooms,
      studyRooms: validated.studyRooms,
      hasBalcony: validated.hasBalcony,
      hasYard: validated.hasYard,
      isDualKey: validated.isDualKey,
      ceilingHeightM: validated.ceilingHeightM
        ? validated.ceilingHeightM.toFixed(2)
        : null,
      furnishingStatus: validated.furnishingStatus,
      floorPlanFileId,
      virtualTourUrl: validated.virtualTourUrl,
    };

    if (validated.action === "create") {
      await db.insert(schema.projectLayouts).values({
        projectId,
        ...payload,
      });

      return okJson({
        message: "Project layout created successfully.",
      });
    }

    const layoutExists = await assertLayoutBelongsToProject(
      projectId,
      validated.layoutId,
    );

    if (!layoutExists) {
      return errorJson("Project layout not found.", 404);
    }

    await db
      .update(schema.projectLayouts)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(schema.projectLayouts.id, validated.layoutId));

    return okJson({
      message: "Project layout updated successfully.",
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
