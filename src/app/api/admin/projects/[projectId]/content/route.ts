import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";

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
    await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/projects");

    const { projectId } = await context.params;
    const projectExists = await assertProjectExists(projectId);

    if (!projectExists) {
      return errorJson("Project not found.", 404);
    }

    const body = await request.json();
    const validated = contentActionSchema.parse(body);

    if (validated.action === "create-nearby") {
      await db.insert(schema.projectNearbyPlaces).values({
        projectId,
        name: validated.name,
        category: validated.category,
        distanceKm: toOptionalDecimal(validated.distanceKm),
        sortOrder: validated.sortOrder,
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

      return okJson({ message: "Nearby place updated successfully." });
    }

    if (validated.action === "remove-nearby") {
      await db
        .delete(schema.projectNearbyPlaces)
        .where(
          and(
            eq(schema.projectNearbyPlaces.id, validated.nearbyId),
            eq(schema.projectNearbyPlaces.projectId, projectId),
          ),
        );

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

    return okJson({ message: "Tag created and attached successfully." });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
