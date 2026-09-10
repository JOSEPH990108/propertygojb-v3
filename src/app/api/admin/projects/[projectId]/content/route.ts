import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { writeAuditLog } from "@/lib/audit/log";
import { authorizeApiRoles } from "@/lib/auth/api-guards";
import {
  canonicalUrlSchema,
  heroVideoUrlSchema,
  publishScheduleSchema,
} from "@/lib/admin/project-content-validation";
import { revalidatePublicProjectData } from "@/lib/public/project-revalidation";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

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

const nullableDecimal = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? null : Number(value),
  z.number().min(0).nullable(),
);

const contentActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update-marketing"),
    metaTitle: optionalText(70),
    metaDescription: optionalText(180),
    canonicalUrl: canonicalUrlSchema,
    ogTitle: optionalText(100),
    ogDescription: optionalText(300),
    heroVideoUrl: heroVideoUrlSchema,
    highlights: z.array(z.string().trim().min(1).max(200)).max(12),
    faqs: z
      .array(
        z.object({
          question: z.string().trim().min(1).max(200),
          answer: z.string().trim().min(1).max(1200),
        }),
      )
      .max(20),
  }),
  publishScheduleSchema.extend({
    action: z.literal("update-publication"),
  }),
  z.object({
    action: z.literal("set-og-image"),
    fileId: z.string().trim().min(1).nullable(),
  }),
  z.object({
    action: z.literal("create-nearby"),
    name: z.string().trim().min(1, "Nearby place name is required.").max(200),
    category: z.string().trim().min(1).max(50),
    distanceKm: nullableDecimal,
    sortOrder: z.coerce.number().int().min(0).max(999999).default(0),
  }),
  z.object({
    action: z.literal("update-nearby"),
    nearbyId: z.string().min(1, "Nearby place is required."),
    name: z.string().trim().min(1, "Nearby place name is required.").max(200),
    category: z.string().trim().min(1).max(50),
    distanceKm: nullableDecimal,
    sortOrder: z.coerce.number().int().min(0).max(999999).default(0),
  }),
  z.object({
    action: z.literal("remove-nearby"),
    nearbyId: z.string().min(1, "Nearby place is required."),
  }),
  z.object({
    action: z.literal("attach-amenity"),
    amenityId: z.string().min(1, "Amenity is required."),
  }),
  z.object({
    action: z.literal("detach-amenity"),
    amenityId: z.string().min(1, "Amenity is required."),
  }),
  z.object({
    action: z.literal("create-amenity"),
    name: z.string().trim().min(1, "Amenity name is required.").max(200),
    description: optionalText(1000),
  }),
  z.object({
    action: z.literal("attach-tag"),
    tagId: z.string().min(1, "Tag is required."),
  }),
  z.object({
    action: z.literal("detach-tag"),
    tagId: z.string().min(1, "Tag is required."),
  }),
  z.object({
    action: z.literal("create-tag"),
    name: z.string().trim().min(1, "Tag name is required.").max(200),
    description: optionalText(1000),
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

async function assertNearbyBelongsToProject(projectId: string, nearbyId: string) {
  const nearby = await db.query.projectNearbyPlaces.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.id, nearbyId), eq(table.projectId, projectId)),
    columns: {
      id: true,
    },
  });

  return Boolean(nearby);
}

function toOptionalDecimal(value: number | null) {
  return value === null ? null : value.toFixed(2);
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
    const validated = contentActionSchema.parse(body);

    async function auditMutation(params: {
      actionType: string;
      changeSummary: string;
      beforeJson?: unknown;
      afterJson?: unknown;
    }) {
      await writeAuditLog({
        actionType: params.actionType,
        entityType: "PROJECT",
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

    if (validated.action === "update-marketing") {
      const before = await db.query.projects.findFirst({
        where: (table, { eq }) => eq(table.id, projectId),
        columns: {
          metaTitle: true,
          metaDescription: true,
          canonicalUrl: true,
          ogTitle: true,
          ogDescription: true,
          heroVideoUrl: true,
          highlightsJson: true,
          faqJson: true,
        },
      });

      const after = {
        metaTitle: validated.metaTitle,
        metaDescription: validated.metaDescription,
        canonicalUrl: validated.canonicalUrl,
        ogTitle: validated.ogTitle,
        ogDescription: validated.ogDescription,
        heroVideoUrl: validated.heroVideoUrl,
        highlightsJson: validated.highlights,
        faqJson: validated.faqs,
      };

      await db
        .update(schema.projects)
        .set({ ...after, updatedAt: new Date() })
        .where(eq(schema.projects.id, projectId));

      await auditMutation({
        actionType: "UPDATE_CONTENT",
        changeSummary: "Updated public project SEO and marketing content.",
        beforeJson: before,
        afterJson: after,
      });

      return okJson({ message: "Marketing content updated successfully." });
    }

    if (validated.action === "update-publication") {
      if (
        validated.isPublished &&
        validated.publishedAt &&
        new Date(validated.publishedAt).getTime() <= Date.now()
      ) {
        return errorJson("Scheduled publication must be in the future.", 400);
      }

      const before = await db.query.projects.findFirst({
        where: (table, { eq }) => eq(table.id, projectId),
        columns: { isPublished: true, publishedAt: true },
      });
      const publishedAt = validated.isPublished
        ? validated.publishedAt
          ? new Date(validated.publishedAt)
          : new Date()
        : null;
      const after = {
        isPublished: validated.isPublished,
        publishedAt,
      };

      await db
        .update(schema.projects)
        .set({ ...after, updatedAt: new Date() })
        .where(eq(schema.projects.id, projectId));

      await auditMutation({
        actionType: "UPDATE_PUBLICATION",
        changeSummary: validated.isPublished
          ? publishedAt && publishedAt.getTime() > Date.now()
            ? "Scheduled public project publication."
            : "Published project on the public website."
          : "Moved public project back to draft.",
        beforeJson: before,
        afterJson: after,
      });

      return okJson({ message: "Publication settings updated successfully." });
    }

    if (validated.action === "set-og-image") {
      if (validated.fileId) {
        const selectedMedia = await db.query.projectMedia.findFirst({
          where: (table, { and, eq }) =>
            and(eq(table.projectId, projectId), eq(table.fileId, validated.fileId as string)),
          columns: { fileId: true },
        });

        if (!selectedMedia) {
          return errorJson("Choose an image from this project's media library.", 400);
        }
      }

      const before = await db.query.projects.findFirst({
        where: (table, { eq }) => eq(table.id, projectId),
        columns: { ogImageFileId: true },
      });
      const after = { ogImageFileId: validated.fileId };

      await db
        .update(schema.projects)
        .set({ ...after, updatedAt: new Date() })
        .where(eq(schema.projects.id, projectId));

      await auditMutation({
        actionType: "UPDATE_OG_IMAGE",
        changeSummary: validated.fileId
          ? "Selected the public social sharing image."
          : "Removed the custom social sharing image.",
        beforeJson: before,
        afterJson: after,
      });

      return okJson({ message: "Social sharing image updated successfully." });
    }

    if (validated.action === "create-nearby") {
      const inserted = await db
        .insert(schema.projectNearbyPlaces)
        .values({
          projectId,
          name: validated.name,
          category: validated.category,
          distanceKm: toOptionalDecimal(validated.distanceKm),
          sortOrder: validated.sortOrder,
        })
        .returning({ id: schema.projectNearbyPlaces.id });

      await auditMutation({
        actionType: "CREATE_NEARBY_PLACE",
        changeSummary: "Added a nearby place to public project content.",
        afterJson: { id: inserted[0]?.id, ...validated },
      });

      return okJson({ message: "Nearby place created successfully." });
    }

    if (validated.action === "update-nearby") {
      const nearbyExists = await assertNearbyBelongsToProject(
        projectId,
        validated.nearbyId,
      );

      if (!nearbyExists) {
        return errorJson("Nearby place not found.", 404);
      }

      const before = await db.query.projectNearbyPlaces.findFirst({
        where: (table, { eq }) => eq(table.id, validated.nearbyId),
      });

      await db
        .update(schema.projectNearbyPlaces)
        .set({
          name: validated.name,
          category: validated.category,
          distanceKm: toOptionalDecimal(validated.distanceKm),
          sortOrder: validated.sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(schema.projectNearbyPlaces.id, validated.nearbyId));

      await auditMutation({
        actionType: "UPDATE_NEARBY_PLACE",
        changeSummary: "Updated a nearby place in public project content.",
        beforeJson: before,
        afterJson: validated,
      });

      return okJson({ message: "Nearby place updated successfully." });
    }

    if (validated.action === "remove-nearby") {
      const before = await db.query.projectNearbyPlaces.findFirst({
        where: (table, { and, eq }) =>
          and(eq(table.id, validated.nearbyId), eq(table.projectId, projectId)),
      });

      if (!before) {
        return errorJson("Nearby place not found.", 404);
      }

      await db
        .delete(schema.projectNearbyPlaces)
        .where(
          and(
            eq(schema.projectNearbyPlaces.id, validated.nearbyId),
            eq(schema.projectNearbyPlaces.projectId, projectId),
          ),
        );

      await auditMutation({
        actionType: "REMOVE_NEARBY_PLACE",
        changeSummary: "Removed a nearby place from public project content.",
        beforeJson: before,
      });

      return okJson({ message: "Nearby place removed successfully." });
    }

    if (validated.action === "attach-amenity") {
      const existing = await db.query.projectAmenities.findFirst({
        where: (table, { and, eq }) =>
          and(
            eq(table.projectId, projectId),
            eq(table.amenityId, validated.amenityId),
          ),
        columns: {
          projectId: true,
        },
      });

      if (!existing) {
        await db.insert(schema.projectAmenities).values({
          projectId,
          amenityId: validated.amenityId,
        });
      }


      await auditMutation({
        actionType: "ATTACH_AMENITY",
        changeSummary: "Attached an amenity to public project content.",
        beforeJson: { attached: Boolean(existing), amenityId: validated.amenityId },
        afterJson: { attached: true, amenityId: validated.amenityId },
      });

      return okJson({ message: "Amenity attached successfully." });
    }

    if (validated.action === "detach-amenity") {
      await db
        .delete(schema.projectAmenities)
        .where(
          and(
            eq(schema.projectAmenities.projectId, projectId),
            eq(schema.projectAmenities.amenityId, validated.amenityId),
          ),
        );

      await auditMutation({
        actionType: "DETACH_AMENITY",
        changeSummary: "Detached an amenity from public project content.",
        beforeJson: { attached: true, amenityId: validated.amenityId },
        afterJson: { attached: false, amenityId: validated.amenityId },
      });

      return okJson({ message: "Amenity detached successfully." });
    }

    if (validated.action === "create-amenity") {
      const slug = slugify(validated.name);

      const existing = await db.query.amenities.findFirst({
        where: (table, { eq }) => eq(table.slug, slug),
        columns: {
          id: true,
        },
      });

      if (existing) {
        return errorJson("Amenity already exists.", 409);
      }

      const inserted = await db
        .insert(schema.amenities)
        .values({
          name: validated.name,
          slug,
          description: validated.description,
          isActive: true,
        })
        .returning({
          id: schema.amenities.id,
        });

      await db.insert(schema.projectAmenities).values({
        projectId,
        amenityId: inserted[0].id,
      });

      await auditMutation({
        actionType: "CREATE_AMENITY",
        changeSummary: "Created and attached an amenity to public project content.",
        afterJson: { id: inserted[0].id, ...validated },
      });

      return okJson({ message: "Amenity created and attached successfully." });
    }

    if (validated.action === "attach-tag") {
      const existing = await db.query.projectTags.findFirst({
        where: (table, { and, eq }) =>
          and(eq(table.projectId, projectId), eq(table.tagId, validated.tagId)),
        columns: {
          projectId: true,
        },
      });

      if (!existing) {
        await db.insert(schema.projectTags).values({
          projectId,
          tagId: validated.tagId,
        });
      }


      await auditMutation({
        actionType: "ATTACH_TAG",
        changeSummary: "Attached a tag to public project content.",
        beforeJson: { attached: Boolean(existing), tagId: validated.tagId },
        afterJson: { attached: true, tagId: validated.tagId },
      });

      return okJson({ message: "Tag attached successfully." });
    }

    if (validated.action === "detach-tag") {
      await db
        .delete(schema.projectTags)
        .where(
          and(
            eq(schema.projectTags.projectId, projectId),
            eq(schema.projectTags.tagId, validated.tagId),
          ),
        );

      await auditMutation({
        actionType: "DETACH_TAG",
        changeSummary: "Detached a tag from public project content.",
        beforeJson: { attached: true, tagId: validated.tagId },
        afterJson: { attached: false, tagId: validated.tagId },
      });

      return okJson({ message: "Tag detached successfully." });
    }

    const slug = slugify(validated.name);

    const existing = await db.query.tags.findFirst({
      where: (table, { eq }) => eq(table.slug, slug),
      columns: {
        id: true,
      },
    });

    if (existing) {
      return errorJson("Tag already exists.", 409);
    }

    const inserted = await db
      .insert(schema.tags)
      .values({
        name: validated.name,
        slug,
        description: validated.description,
        isActive: true,
      })
      .returning({
        id: schema.tags.id,
      });

    await db.insert(schema.projectTags).values({
      projectId,
      tagId: inserted[0].id,
    });

    await auditMutation({
      actionType: "CREATE_TAG",
      changeSummary: "Created and attached a tag to public project content.",
      afterJson: { id: inserted[0].id, ...validated },
    });

    return okJson({ message: "Tag created and attached successfully." });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
