import "server-only";

type UnitLike = {
  layoutId: string | null;
  basePrice: string;
  finalPrice: string | null;
  landAreaSqft: string | null;
  bookingStatusCode: string | null;
  positionTypeName: string | null;
  lotTypeName: string | null;
};

export type LayoutAvailability = {
  totalUnitCount: number;
  availableUnitCount: number;
  priceFrom: number | null;
  landAreaSqft: string | null;
};

function parsePrice(unit: Pick<UnitLike, "basePrice" | "finalPrice">) {
  const price = Number(unit.finalPrice ?? unit.basePrice);
  return Number.isFinite(price) && price > 0 ? price : null;
}

/** Aggregates real unit rows (already fetched for the detail page) per layout — no invented stats. */
export function buildLayoutAvailability(
  units: UnitLike[],
): Map<string, LayoutAvailability> {
  const byLayout = new Map<string, LayoutAvailability>();

  for (const unit of units) {
    if (!unit.layoutId) {
      continue;
    }

    const existing = byLayout.get(unit.layoutId) ?? {
      totalUnitCount: 0,
      availableUnitCount: 0,
      priceFrom: null,
      landAreaSqft: null,
    };

    existing.totalUnitCount += 1;

    if (unit.bookingStatusCode === "AVAILABLE") {
      existing.availableUnitCount += 1;
    }

    const price = parsePrice(unit);
    if (
      price !== null &&
      (existing.priceFrom === null || price < existing.priceFrom)
    ) {
      existing.priceFrom = price;
    }

    if (!existing.landAreaSqft && unit.landAreaSqft) {
      existing.landAreaSqft = unit.landAreaSqft;
    }

    byLayout.set(unit.layoutId, existing);
  }

  return byLayout;
}

export type UnitPositionGroup = {
  label: string;
  count: number;
};

/** Real per-unit position/lot-type breakdown (e.g. Corner/Intermediate/End) — no fixed fabricated categories. */
export function buildUnitPositionBreakdown(
  units: UnitLike[],
): UnitPositionGroup[] {
  const counts = new Map<string, number>();

  for (const unit of units) {
    const label = unit.positionTypeName ?? unit.lotTypeName;

    if (!label) {
      continue;
    }

    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}
