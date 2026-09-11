import { NextResponse } from "next/server";

import { createPublicProjectsTokenRequest } from "@/lib/realtime/public-projects";

export const dynamic = "force-dynamic";

export async function GET() {
  const tokenRequest = await createPublicProjectsTokenRequest();

  if (!tokenRequest) {
    return NextResponse.json({ enabled: false });
  }

  return NextResponse.json(tokenRequest, {
    headers: { "Cache-Control": "no-store" },
  });
}