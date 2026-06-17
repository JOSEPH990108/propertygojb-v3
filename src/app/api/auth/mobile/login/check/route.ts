import { NextRequest } from "next/server";

import { db } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { parseMobileInput } from "@/lib/auth/mobile-validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = parseMobileInput(body);

    const user = await db.query.user.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.phoneNumber, phoneNumber),
          eq(table.phoneNumberVerified, true),
        ),
      columns: {
        id: true,
      },
    });

    if (!user) {
      return errorJson("No account found with this mobile number.", 404);
    }

    return okJson({});
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
