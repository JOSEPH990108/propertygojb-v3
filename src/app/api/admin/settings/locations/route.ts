import { eq } from "drizzle-orm";
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

const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required.")
  .max(150)
  .transform(slugify);

const locationActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create-state"),
    name: z.string().trim().min(1, "State name is required.").max(100),
    slug: slugSchema,
    country: z.string().trim().min(1).max(100).default("Malaysia"),
  }),
  z.object({
    action: z.literal("update-state"),
    id: z.string().min(1, "State is required."),
    name: z.string().trim().min(1, "State name is required.").max(100),
    slug: slugSchema,
    country: z.string().trim().min(1).max(100).default("Malaysia"),
  }),
  z.object({
    action: z.literal("create-region"),
    stateId: z.string().min(1, "State is required."),
    name: z.string().trim().min(1, "Region name is required.").max(150),
    slug: slugSchema,
  }),
  z.object({
    action: z.literal("update-region"),
    id: z.string().min(1, "Region is required."),
    stateId: z.string().min(1, "State is required."),
    name: z.string().trim().min(1, "Region name is required.").max(150),
    slug: slugSchema,
  }),
  z.object({
    action: z.literal("create-area"),
    regionId: z.string().min(1, "Region is required."),
    name: z.string().trim().min(1, "Area name is required.").max(150),
    slug: slugSchema,
  }),
  z.object({
    action: z.literal("update-area"),
    id: z.string().min(1, "Area is required."),
    regionId: z.string().min(1, "Region is required."),
    name: z.string().trim().min(1, "Area name is required.").max(150),
    slug: slugSchema,
  }),
]);

async function stateExists(stateId: string) {
  const state = await db.query.states.findFirst({
    where: (table, { eq }) => eq(table.id, stateId),
    columns: { id: true },
  });

  return Boolean(state);
}

async function regionExists(regionId: string) {
  const region = await db.query.regions.findFirst({
    where: (table, { eq }) => eq(table.id, regionId),
    columns: { id: true },
  });

  return Boolean(region);
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/settings/locations");

    const body = await request.json();
    const validated = locationActionSchema.parse(body);

    if (validated.action === "create-state") {
      const existing = await db.query.states.findFirst({
        where: (table, { eq }) => eq(table.slug, validated.slug),
        columns: { id: true },
      });

      if (existing) {
        return errorJson("State slug is already used.", 409);
      }

      await db.insert(schema.states).values({
        name: validated.name,
        slug: validated.slug,
        country: validated.country,
      });

      return okJson({ message: "State created successfully." });
    }

    if (validated.action === "update-state") {
      const existing = await db.query.states.findFirst({
        where: (table, { and, eq, ne }) =>
          and(eq(table.slug, validated.slug), ne(table.id, validated.id)),
        columns: { id: true },
      });

      if (existing) {
        return errorJson("State slug is already used.", 409);
      }

      await db
        .update(schema.states)
        .set({
          name: validated.name,
          slug: validated.slug,
          country: validated.country,
          updatedAt: new Date(),
        })
        .where(eq(schema.states.id, validated.id));

      return okJson({ message: "State updated successfully." });
    }

    if (validated.action === "create-region") {
      const exists = await stateExists(validated.stateId);

      if (!exists) {
        return errorJson("State not found.", 404);
      }

      const existing = await db.query.regions.findFirst({
        where: (table, { and, eq }) =>
          and(eq(table.stateId, validated.stateId), eq(table.slug, validated.slug)),
        columns: { id: true },
      });

      if (existing) {
        return errorJson("Region slug is already used under this state.", 409);
      }

      await db.insert(schema.regions).values({
        stateId: validated.stateId,
        name: validated.name,
        slug: validated.slug,
      });

      return okJson({ message: "Region created successfully." });
    }

    if (validated.action === "update-region") {
      const exists = await stateExists(validated.stateId);

      if (!exists) {
        return errorJson("State not found.", 404);
      }

      const existing = await db.query.regions.findFirst({
        where: (table, { and, eq, ne }) =>
          and(
            eq(table.stateId, validated.stateId),
            eq(table.slug, validated.slug),
            ne(table.id, validated.id),
          ),
        columns: { id: true },
      });

      if (existing) {
        return errorJson("Region slug is already used under this state.", 409);
      }

      await db
        .update(schema.regions)
        .set({
          stateId: validated.stateId,
          name: validated.name,
          slug: validated.slug,
          updatedAt: new Date(),
        })
        .where(eq(schema.regions.id, validated.id));

      return okJson({ message: "Region updated successfully." });
    }

    if (validated.action === "create-area") {
      const exists = await regionExists(validated.regionId);

      if (!exists) {
        return errorJson("Region not found.", 404);
      }

      const existing = await db.query.areas.findFirst({
        where: (table, { and, eq }) =>
          and(eq(table.regionId, validated.regionId), eq(table.slug, validated.slug)),
        columns: { id: true },
      });

      if (existing) {
        return errorJson("Area slug is already used under this region.", 409);
      }

      await db.insert(schema.areas).values({
        regionId: validated.regionId,
        name: validated.name,
        slug: validated.slug,
      });

      return okJson({ message: "Area created successfully." });
    }

    const exists = await regionExists(validated.regionId);

    if (!exists) {
      return errorJson("Region not found.", 404);
    }

    const existing = await db.query.areas.findFirst({
      where: (table, { and, eq, ne }) =>
        and(
          eq(table.regionId, validated.regionId),
          eq(table.slug, validated.slug),
          ne(table.id, validated.id),
        ),
      columns: { id: true },
    });

    if (existing) {
      return errorJson("Area slug is already used under this region.", 409);
    }

    await db
      .update(schema.areas)
      .set({
        regionId: validated.regionId,
        name: validated.name,
        slug: validated.slug,
        updatedAt: new Date(),
      })
      .where(eq(schema.areas.id, validated.id));

    return okJson({ message: "Area updated successfully." });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
