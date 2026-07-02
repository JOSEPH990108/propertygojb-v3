import { NextRequest } from "next/server";
import { z } from "zod";

import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { expireOverdueBookings } from "@/lib/bookings/expiry";

export const runtime = "nodejs";

const expireAutomationSchema = z.object({
  dryRun: z.preprocess((value) => {
    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }

    return value;
  }, z.boolean().optional().default(false)),
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
});

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authorization.slice("bearer ".length).trim();
}

function isAuthorizedAutomationRequest(request: NextRequest) {
  const expectedSecret = process.env.BOOKING_AUTOMATION_SECRET?.trim();

  if (!expectedSecret) {
    return false;
  }

  const headerSecret = request.headers.get("x-automation-secret")?.trim() ?? "";
  const bearerToken = getBearerToken(request);

  return headerSecret === expectedSecret || bearerToken === expectedSecret;
}

async function runExpiryAutomation(
  request: NextRequest,
  payload: Record<string, unknown>,
) {
  if (!isAuthorizedAutomationRequest(request)) {
    return errorJson("Unauthorized automation request.", 401);
  }

  const validated = expireAutomationSchema.parse(payload);
  const result = await expireOverdueBookings({
    dryRun: validated.dryRun,
    limit: validated.limit,
    sourceEventType: "BOOKING_EXPIRY_AUTOMATION",
  });

  return okJson({
    message: validated.dryRun
      ? `Dry run completed. ${result.expiredCount} booking(s) would expire.`
      : `Expiry automation completed. ${result.expiredCount} booking(s) expired.`,
    ...result,
  });
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    return runExpiryAutomation(request, payload);
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    return runExpiryAutomation(request, {
      dryRun: searchParams.get("dryRun") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
