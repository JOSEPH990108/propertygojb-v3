import { NextResponse } from "next/server";

import { getPublicProjectsVersion } from "@/lib/public/project-revalidation";

export const dynamic = "force-dynamic";

export async function GET() {
  const version = await getPublicProjectsVersion();

  return NextResponse.json(
    { version },
    { headers: { "Cache-Control": "no-store" } },
  );
}