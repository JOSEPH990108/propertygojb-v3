import { NextRequest } from "next/server";
import { z } from "zod";

import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";
import { expireOverdueBookings } from "@/lib/bookings/expiry";

export const runtime = "nodejs";

const expireBookingsSchema = z.object({
  dryRun: z.boolean().optional().default(true),
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
});

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireRole(
      ["ADMIN", "SUPER_ADMIN"],
      "/admin/bookings",
    );

    const currentUser = authContext.user as { id?: unknown };
    const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";

    if (!currentUserId) {
      return errorJson("Current user not found.", 401);
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const validated = expireBookingsSchema.parse(body);

    const result = await expireOverdueBookings({
      dryRun: validated.dryRun,
      limit: validated.limit,
      actorUserId: currentUserId,
      sourceEventType: "ADMIN_BOOKING_EXPIRY_MANUAL",
    });

    return okJson({
      message: validated.dryRun
        ? `Dry run completed. ${result.expiredCount} booking(s) would expire.`
        : `Expiry check completed. ${result.expiredCount} booking(s) expired.`,
      ...result,
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
