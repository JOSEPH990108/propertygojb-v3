import { and, eq } from "drizzle-orm";
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

const mediaActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    url: z.string().trim().url("Image URL must be valid.").max(1000),
    mediaTypeId: optionalId,
    caption: optionalText(300),
    sortOrder: z.coerce.number().int().min(0).max(999999).default(0),
  }),
  z.object({
    action: z.literal("update"),
    mediaId: z.string().min(1, "Media item is required."),
    mediaTypeId: optionalId,
    caption: optionalText(300),
    sortOrder: z.coerce.number().int().min(0).max(999999).default(0),
  }),
  z.object({
    action: z.literal("remove"),
    mediaId: z.string().min(1, "Media item is required."),
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

  if (cleanUrl.endsWith(".gif")) {
    return "image/gif";
  }

  if (cleanUrl.endsWith(".svg")) {
    return "image/svg+xml";
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

async function assertMediaBelongsToProject(projectId: string, mediaId: string) {
  const media = await db.query.projectMedia.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.id, mediaId), eq(table.projectId, projectId)),
    columns: {
      id: true,
    },
  });

  return Boolean(media);
}

async function getOrCreateExternalFile(url: string) {
  const existingFile = await db.query.files.findFirst({
    where: (table, { and, eq }) =>
      and(
        eq(table.provider, "external_url"),
        eq(table.bucket, "project-media"),
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
      bucket: "project-media",
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
    const validated = mediaActionSchema.parse(body);

    if (validated.action === "create") {
      const fileId = await getOrCreateExternalFile(validated.url);

      await db.insert(schema.projectMedia).values({
        projectId,
        fileId,
        mediaTypeId: validated.mediaTypeId,
        caption: validated.caption,
        sortOrder: validated.sortOrder,
      });

      return okJson({
        message: "Project media added successfully.",
      });
    }

    const mediaExists = await assertMediaBelongsToProject(
      projectId,
      validated.mediaId,
    );

    if (!mediaExists) {
      return errorJson("Project media not found.", 404);
    }

    if (validated.action === "update") {
      await db
        .update(schema.projectMedia)
        .set({
          mediaTypeId: validated.mediaTypeId,
          caption: validated.caption,
          sortOrder: validated.sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(schema.projectMedia.id, validated.mediaId));

      return okJson({
        message: "Project media updated successfully.",
      });
    }

    await db
      .delete(schema.projectMedia)
      .where(
        and(
          eq(schema.projectMedia.id, validated.mediaId),
          eq(schema.projectMedia.projectId, projectId),
        ),
      );

    return okJson({
      message: "Project media removed successfully.",
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
