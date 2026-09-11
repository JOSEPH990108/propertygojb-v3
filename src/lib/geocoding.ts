type GeocodeCandidate = {
  display_name: string;
  lat: string;
  lon: string;
};

export class GeocodeRateLimitError extends Error {
  constructor() {
    super("Geocoding service is rate-limited.");
    this.name = "GeocodeRateLimitError";
  }
}

type GeocodeLocationInput = {
  name?: string | null;
  address?: string | null;
  area?: string | null;
  region?: string | null;
  state?: string | null;
  country?: string | null;
};

const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const geocodeCache = new Map<string, GeocodeCandidate | null>();

function buildGeocodeQueries(input: GeocodeLocationInput) {
  const country = input.country?.trim() || "Malaysia";
  const name = input.name?.trim();
  const address = input.address?.trim();
  const area = input.area?.trim();
  const region = input.region?.trim();
  const state = input.state?.trim();

  const queries = [
    [name, address, area, region, state, country].filter(Boolean).join(", "),
    [name, address, area, region, country].filter(Boolean).join(", "),
    [name, address, region, state, country].filter(Boolean).join(", "),
    [name, address, country].filter(Boolean).join(", "),
    [name, area, region, state, country].filter(Boolean).join(", "),
    [name, region, state, country].filter(Boolean).join(", "),
    address,
    [area, region, state, country].filter(Boolean).join(", "),
    [region, state, country].filter(Boolean).join(", "),
    [state, country].filter(Boolean).join(", "),
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  return Array.from(new Set(queries));
}

async function geocodeQuery(query: string) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return null;
  }

  if (geocodeCache.has(normalizedQuery)) {
    return geocodeCache.get(normalizedQuery) ?? null;
  }

  const url = new URL(NOMINATIM_SEARCH_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "my");
  url.searchParams.set("q", normalizedQuery);

  const response = await fetch(url.toString(), {
    headers: {
      "Accept-Language": "en",
      "User-Agent": "PropertyGoJB/1.0 (+https://propertygojb.local)",
    },
    cache: "no-store",
  });

  if (response.status === 429) {
    throw new GeocodeRateLimitError();
  }

  if (!response.ok) {
    geocodeCache.set(normalizedQuery, null);
    return null;
  }

  const payload = (await response.json()) as GeocodeCandidate[];
  const result = payload[0] ?? null;

  geocodeCache.set(normalizedQuery, result);
  return result;
}

export async function geocodeAnyQuery(query: string) {
  return geocodeQuery(query);
}

export async function geocodeProjectLocation(input: GeocodeLocationInput) {
  for (const query of buildGeocodeQueries(input)) {
    const result = await geocodeQuery(query);

    if (result) {
      return result;
    }
  }

  return null;
}
