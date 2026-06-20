import { and, eq, ne } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { getSimpleLookupConfig } from "@/lib/admin/simple-lookups";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";

type CodeLookupTable = typeof schema.projectStatuses;
type SlugLookupTable = typeof schema.amenities;

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

const codeUpsertSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    code: z
      .string()
      .trim()
      .min(1, "Code is required.")
      .max(50)
      .transform((value) => value.toUpperCase().replace(/\s+/g, "_")),
    name: z.string().trim().min(1, "Name is required.").max(100),
    description: optionalText(1000),
    color: optionalText(20),
    icon: optionalText(50),
    sortOrder: z.coerce.number().int().min(0).max(999999).default(0),
    isActive: z.boolean().default(true),
  }),
  z.object({
    action: z.literal("update"),
    id: z.string().min(1, "Lookup item is required."),
    code: z
      .string()
      .trim()
      .min(1, "Code is required.")
      .max(50)
      .transform((value) => value.toUpperCase().replace(/\s+/g, "_")),
    name: z.string().trim().min(1, "Name is required.").max(100),
    description: optionalText(1000),
    color: optionalText(20),
    icon: optionalText(50),
    sortOrder: z.coerce.number().int().min(0).max(999999).default(0),
  }),
]);

const slugUpsertSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    slug: optionalText(200),
    name: z.string().trim().min(1, "Name is required.").max(200),
    description: optionalText(1000),
    isActive: z.boolean().default(true),
  }),
  z.object({
    action: z.literal("update"),
    id: z.string().min(1, "Lookup item is required."),
    slug: optionalText(200),
    name: z.string().trim().min(1, "Name is required.").max(200),
    description: optionalText(1000),
  }),
]);

const itemActionSchema = z.object({
  action: z.enum([
    "toggle-active",
    "soft-delete",
    "restore",
    "permanent-delete",
  ]),
  id: z.string().min(1, "Lookup item is required."),
  isActive: z.boolean().optional(),
});

async function handleCodeLookup(
  table: CodeLookupTable,
  body: unknown,
) {
  const action = z.object({ action: z.string() }).parse(body).action;

  if (action === "create" || action === "update") {
    const validated = codeUpsertSchema.parse(body);

    const existing = await db
      .select({ id: table.id })
      .from(table)
      .where(
        validated.action === "update"
          ? and(eq(table.code, validated.code), ne(table.id, validated.id))
          : eq(table.code, validated.code),
      )
      .limit(1);

    if (existing[0]) {
      return errorJson("Code is already used.", 409);
    }

    if (validated.action === "create") {
      await db.insert(table).values({
        code: validated.code,
        name: validated.name,
        description: validated.description,
        color: validated.color,
        icon: validated.icon,
        sortOrder: validated.sortOrder,
        isActive: validated.isActive,
        deletedAt: null,
      });

      return okJson({ message: "Lookup item created successfully." });
    }

    await db
      .update(table)
      .set({
        code: validated.code,
        name: validated.name,
        description: validated.description,
        color: validated.color,
        icon: validated.icon,
        sortOrder: validated.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(table.id, validated.id));

    return okJson({ message: "Lookup item updated successfully." });
  }

  const validated = itemActionSchema.parse(body);

  if (validated.action === "toggle-active") {
    await db
      .update(table)
      .set({
        isActive: Boolean(validated.isActive),
        updatedAt: new Date(),
      })
      .where(eq(table.id, validated.id));

    return okJson({ message: "Lookup item status updated successfully." });
  }

  if (validated.action === "soft-delete") {
    await db
      .update(table)
      .set({
        isActive: false,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(table.id, validated.id));

    return okJson({ message: "Lookup item deleted successfully." });
  }

  if (validated.action === "restore") {
    await db
      .update(table)
      .set({
        isActive: true,
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(table.id, validated.id));

    return okJson({ message: "Lookup item restored successfully." });
  }

  await db.delete(table).where(eq(table.id, validated.id));

  return okJson({ message: "Lookup item permanently deleted successfully." });
}

async function handleSlugLookup(
  table: SlugLookupTable,
  body: unknown,
) {
  const action = z.object({ action: z.string() }).parse(body).action;

  if (action === "create" || action === "update") {
    const validated = slugUpsertSchema.parse(body);
    const slug = validated.slug ? slugify(validated.slug) : slugify(validated.name);

    const existing = await db
      .select({ id: table.id })
      .from(table)
      .where(
        validated.action === "update"
          ? and(eq(table.slug, slug), ne(table.id, validated.id))
          : eq(table.slug, slug),
      )
      .limit(1);

    if (existing[0]) {
      return errorJson("Slug is already used.", 409);
    }

    if (validated.action === "create") {
      await db.insert(table).values({
        slug,
        name: validated.name,
        description: validated.description,
        isActive: validated.isActive,
        deletedAt: null,
      });

      return okJson({ message: "Lookup item created successfully." });
    }

    await db
      .update(table)
      .set({
        slug,
        name: validated.name,
        description: validated.description,
        updatedAt: new Date(),
      })
      .where(eq(table.id, validated.id));

    return okJson({ message: "Lookup item updated successfully." });
  }

  const validated = itemActionSchema.parse(body);

  if (validated.action === "toggle-active") {
    await db
      .update(table)
      .set({
        isActive: Boolean(validated.isActive),
        updatedAt: new Date(),
      })
      .where(eq(table.id, validated.id));

    return okJson({ message: "Lookup item status updated successfully." });
  }

  if (validated.action === "soft-delete") {
    await db
      .update(table)
      .set({
        isActive: false,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(table.id, validated.id));

    return okJson({ message: "Lookup item deleted successfully." });
  }

  if (validated.action === "restore") {
    await db
      .update(table)
      .set({
        isActive: true,
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(table.id, validated.id));

    return okJson({ message: "Lookup item restored successfully." });
  }

  await db.delete(table).where(eq(table.id, validated.id));

  return okJson({ message: "Lookup item permanently deleted successfully." });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ lookupKey: string }> },
) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/settings/lookups");

    const { lookupKey } = await context.params;
    const config = getSimpleLookupConfig(lookupKey);

    if (!config) {
      return errorJson("Lookup type not found.", 404);
    }

    const body = await request.json();

    if (config.kind === "code") {
      return await handleCodeLookup(config.table as CodeLookupTable, body);
    }

    return await handleSlugLookup(config.table as SlugLookupTable, body);
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
