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

const codeSchema = z
  .string()
  .trim()
  .min(1, "Code is required.")
  .max(50)
  .transform((value) => value.toUpperCase().replace(/\s+/g, "_"));

const propertyClassificationActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create-category"),
    code: codeSchema,
    name: z.string().trim().min(1, "Name is required.").max(100),
    description: optionalText(1000),
    sortOrder: z.coerce.number().int().min(0).max(999999).default(0),
  }),
  z.object({
    action: z.literal("update-category"),
    id: z.string().min(1, "Category is required."),
    code: codeSchema,
    name: z.string().trim().min(1, "Name is required.").max(100),
    description: optionalText(1000),
    sortOrder: z.coerce.number().int().min(0).max(999999).default(0),
  }),
  z.object({
    action: z.literal("toggle-category"),
    id: z.string().min(1, "Category is required."),
    isActive: z.boolean(),
  }),
  z.object({
    action: z.literal("create-type"),
    categoryId: z.string().min(1, "Category is required."),
    code: codeSchema,
    name: z.string().trim().min(1, "Name is required.").max(100),
    description: optionalText(1000),
    sortOrder: z.coerce.number().int().min(0).max(999999).default(0),
  }),
  z.object({
    action: z.literal("update-type"),
    id: z.string().min(1, "Property type is required."),
    categoryId: z.string().min(1, "Category is required."),
    code: codeSchema,
    name: z.string().trim().min(1, "Name is required.").max(100),
    description: optionalText(1000),
    sortOrder: z.coerce.number().int().min(0).max(999999).default(0),
  }),
  z.object({
    action: z.literal("toggle-type"),
    id: z.string().min(1, "Property type is required."),
    isActive: z.boolean(),
  }),
]);

async function assertCategoryExists(categoryId: string) {
  const category = await db.query.propertyCategories.findFirst({
    where: (table, { eq }) => eq(table.id, categoryId),
    columns: {
      id: true,
    },
  });

  return Boolean(category);
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/settings/property-types");

    const body = await request.json();
    const validated = propertyClassificationActionSchema.parse(body);

    if (validated.action === "create-category") {
      const existing = await db.query.propertyCategories.findFirst({
        where: (table, { eq }) => eq(table.code, validated.code),
        columns: {
          id: true,
        },
      });

      if (existing) {
        return errorJson("Category code is already used.", 409);
      }

      await db.insert(schema.propertyCategories).values({
        code: validated.code,
        name: validated.name,
        description: validated.description,
        sortOrder: validated.sortOrder,
        isActive: true,
      });

      return okJson({ message: "Property category created successfully." });
    }

    if (validated.action === "update-category") {
      const existing = await db.query.propertyCategories.findFirst({
        where: (table, { and, eq, ne }) =>
          and(eq(table.code, validated.code), ne(table.id, validated.id)),
        columns: {
          id: true,
        },
      });

      if (existing) {
        return errorJson("Category code is already used.", 409);
      }

      await db
        .update(schema.propertyCategories)
        .set({
          code: validated.code,
          name: validated.name,
          description: validated.description,
          sortOrder: validated.sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(schema.propertyCategories.id, validated.id));

      return okJson({ message: "Property category updated successfully." });
    }

    if (validated.action === "toggle-category") {
      await db
        .update(schema.propertyCategories)
        .set({
          isActive: validated.isActive,
          updatedAt: new Date(),
        })
        .where(eq(schema.propertyCategories.id, validated.id));

      return okJson({
        message: validated.isActive
          ? "Property category enabled successfully."
          : "Property category disabled successfully.",
      });
    }

    if (validated.action === "create-type") {
      const categoryExists = await assertCategoryExists(validated.categoryId);

      if (!categoryExists) {
        return errorJson("Category not found.", 404);
      }

      const existing = await db.query.propertyTypes.findFirst({
        where: (table, { eq }) => eq(table.code, validated.code),
        columns: {
          id: true,
        },
      });

      if (existing) {
        return errorJson("Property type code is already used.", 409);
      }

      await db.insert(schema.propertyTypes).values({
        categoryId: validated.categoryId,
        code: validated.code,
        name: validated.name,
        slug: slugify(validated.name),
        description: validated.description,
        sortOrder: validated.sortOrder,
        isActive: true,
      });

      return okJson({ message: "Property type created successfully." });
    }

    if (validated.action === "update-type") {
      const categoryExists = await assertCategoryExists(validated.categoryId);

      if (!categoryExists) {
        return errorJson("Category not found.", 404);
      }

      const existing = await db.query.propertyTypes.findFirst({
        where: (table, { and, eq, ne }) =>
          and(eq(table.code, validated.code), ne(table.id, validated.id)),
        columns: {
          id: true,
        },
      });

      if (existing) {
        return errorJson("Property type code is already used.", 409);
      }

      await db
        .update(schema.propertyTypes)
        .set({
          categoryId: validated.categoryId,
          code: validated.code,
          name: validated.name,
          slug: slugify(validated.name),
          description: validated.description,
          sortOrder: validated.sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(schema.propertyTypes.id, validated.id));

      return okJson({ message: "Property type updated successfully." });
    }

    await db
      .update(schema.propertyTypes)
      .set({
        isActive: validated.isActive,
        updatedAt: new Date(),
      })
      .where(eq(schema.propertyTypes.id, validated.id));

    return okJson({
      message: validated.isActive
        ? "Property type enabled successfully."
        : "Property type disabled successfully.",
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
