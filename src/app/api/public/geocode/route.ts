import { NextResponse } from "next/server";

import { GeocodeRateLimitError, geocodeAnyQuery } from "@/lib/geocoding";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const result = await geocodeAnyQuery(query);

    if (!result) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    return NextResponse.json({
      results: [result],
    });
  } catch (error) {
    if (error instanceof GeocodeRateLimitError) {
      return NextResponse.json(
        { results: [], message: "Geocoding service is rate-limited." },
        { status: 429 },
      );
    }

    throw error;
  }
}