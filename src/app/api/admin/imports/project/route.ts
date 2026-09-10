import { NextRequest } from "next/server";
import { z } from "zod";

import {
  executeProjectImport,
  previewProjectImport,
} from "@/lib/admin/imports/project-import-executor";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";

const importRequestSchema = z.object({
  action: z.enum(["preview", "execute"]),
  payload: z.unknown(),
});

export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/imports");

    const body = await request.json();
    const validated = importRequestSchema.parse(body);

    if (validated.action === "preview") {
      const preview = await previewProjectImport(validated.payload);

      return okJson({
        message: "Import preview generated successfully.",
        ...preview,
      });
    }

    const result = await executeProjectImport(validated.payload);

    return okJson({
      message: "Project import executed successfully.",
      ...result,
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
