import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { writeAuditLog } from "@/lib/audit/log";
import { externalImageUrlSchema } from "@/lib/admin/project-content-validation";
import { authorizeApiRoles } from "@/lib/auth/api-guards";
import { revalidatePublicProjectData } from "@/lib/public/project-revalidation";

const optionalId = z
  .string()
  .trim()
  .nullish()
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
    url: externalImageUrlSchema.refine((value): value is string => Boolean(value), {
      message: "Image URL is required.",
    }),
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
    const authorization = await authorizeApiRoles(["ADMIN", "SUPER_ADMIN"]);

    if (!authorization.ok) {
      return errorJson(authorization.message, authorization.status);
    }

    const { authContext } = authorization;
    const currentUser = authContext.user as { id?: string };

    const { projectId } = await context.params;
    const projectExists = await assertProjectExists(projectId);

    if (!projectExists) {
      return errorJson("Project not found.", 404);
    }

    const body = await request.json();
    const validated = mediaActionSchema.parse(body);

    async function auditMedia(params: {
      actionType: string;
      changeSummary: string;
      beforeJson?: unknown;
      afterJson?: unknown;
    }) {
      await writeAuditLog({
        actionType: params.actionType,
        entityType: "PROJECT_MEDIA",
        entityId: projectId,
        actorUserId: currentUser.id,
        actorRoleId: authContext.roleId,
        sourceApp: "ADMIN_PORTAL",
        changeSummary: params.changeSummary,
        beforeJson: params.beforeJson,
        afterJson: params.afterJson,
        request,
      });

      await revalidatePublicProjectData();
    }

    if (validated.action === "create") {
      const fileId = await getOrCreateExternalFile(validated.url);

      const inserted = await db
        .insert(schema.projectMedia)
        .values({
          projectId,
          fileId,
          mediaTypeId: validated.mediaTypeId,
          caption: validated.caption,
          sortOrder: validated.sortOrder,
        })
        .returning({ id: schema.projectMedia.id });

      await auditMedia({
        actionType: "CREATE_PROJECT_MEDIA",
        changeSummary: "Added an external image to the project media library.",
        afterJson: { id: inserted[0]?.id, fileId, ...validated },
      });

      return okJson({
        message: "Project media added successfully.",
        mediaId: inserted[0]?.id,
        fileId,
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
      const before = await db.query.projectMedia.findFirst({
        where: (table, { eq }) => eq(table.id, validated.mediaId),
      });

      await db
        .update(schema.projectMedia)
        .set({
          mediaTypeId: validated.mediaTypeId,
          caption: validated.caption,
          sortOrder: validated.sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(schema.projectMedia.id, validated.mediaId));

      await auditMedia({
        actionType: "UPDATE_PROJECT_MEDIA",
        changeSummary: "Updated project media presentation details.",
        beforeJson: before,
        afterJson: validated,
      });

      return okJson({
        message: "Project media updated successfully.",
      });
    }

    const before = await db.query.projectMedia.findFirst({
      where: (table, { and, eq }) =>
        and(eq(table.id, validated.mediaId), eq(table.projectId, projectId)),
    });

    if (!before) {
      return errorJson("Project media not found.", 404);
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(schema.projectMedia)
        .where(
          and(
            eq(schema.projectMedia.id, validated.mediaId),
            eq(schema.projectMedia.projectId, projectId),
          ),
        );

      await tx
        .update(schema.projects)
        .set({ ogImageFileId: null, updatedAt: new Date() })
        .where(
          and(
            eq(schema.projects.id, projectId),
            eq(schema.projects.ogImageFileId, before.fileId),
          ),
        );
    });

    await auditMedia({
      actionType: "REMOVE_PROJECT_MEDIA",
      changeSummary: "Removed an image from the project media library.",
      beforeJson: before,
      afterJson: { removed: true, ogImageSelectionCleared: true },
    });

    return okJson({
      message: "Project media removed successfully.",
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
