import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { getSimpleLookupConfig } from "@/lib/admin/simple-lookups";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";

type SimpleLookupTable = typeof schema.projectStatuses;

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

const lookupActionSchema = z.discriminatedUnion("action", [
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
  z.object({
    action: z.literal("toggle-active"),
    id: z.string().min(1, "Lookup item is required."),
    isActive: z.boolean(),
  }),
]);

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

    const table = config.table as SimpleLookupTable;
    const body = await request.json();
    const validated = lookupActionSchema.parse(body);

    if (validated.action === "create") {
      const existing = await db.query.projectStatuses.findFirst({
        where: () => eq(table.code, validated.code),
        columns: {
          id: true,
        },
      });

      if (existing) {
        return errorJson("Code is already used.", 409);
      }

      await db.insert(table).values({
        code: validated.code,
        name: validated.name,
        description: validated.description,
        color: validated.color,
        icon: validated.icon,
        sortOrder: validated.sortOrder,
        isActive: validated.isActive,
      });

      return okJson({
        message: "Lookup item created successfully.",
      });
    }

    if (validated.action === "update") {
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

      return okJson({
        message: "Lookup item updated successfully.",
      });
    }

    await db
      .update(table)
      .set({
        isActive: validated.isActive,
        updatedAt: new Date(),
      })
      .where(eq(table.id, validated.id));

    return okJson({
      message: validated.isActive
        ? "Lookup item enabled successfully."
        : "Lookup item disabled successfully.",
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
