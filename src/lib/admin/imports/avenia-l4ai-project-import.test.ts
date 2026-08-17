import aveniaImport from "../../../../docs/imports/avenia-l4ai-project-import.json";
import { describe, expect, it } from "vitest";

import { parseProjectImportPayload } from "./project-import-schema";

describe("Avenia L4(a)(i) import dataset", () => {
  it("preserves all price-list lots as availability pending", () => {
    const payload = parseProjectImportPayload(aveniaImport);

    expect(payload.units).toHaveLength(165);
    expect(payload.units.every((unit) => unit.bookingStatus !== null && typeof unit.bookingStatus === "object" && unit.bookingStatus.code === "UNVERIFIED")).toBe(true);
  });

  it("keeps exact price-list metadata and predicted 11-lot strip coverage", () => {
    const payload = parseProjectImportPayload(aveniaImport);
    const rowGroups = payload.availabilityPlans[0]?.plan.sitePlan?.rowGroups ?? [];
    const rows = rowGroups.flatMap((group) => group.rows);

    expect(rowGroups.map((group) => group.rows.length)).toEqual([5, 5, 5]);
    expect(rows.map((row) => row.length)).toEqual(Array(15).fill(11));
    expect(new Set(rows.flat()).size).toBe(165);
    expect(rows.flat()[0]).toBe("233009");
    expect(rows.flat().at(-1)).toBe("233173");
    expect(rowGroups.map((group) => group.rows.flat().length)).toEqual([55, 55, 55]);
    expect(payload.units.find((unit) => unit.unitNo === "233009")).toMatchObject({
      layoutCode: "A1",
      positionType: { code: "END" },
      facingType: { code: "N" },
      basePrice: 1091800,
    });
    expect(payload.units.find((unit) => unit.unitNo === "233173")).toMatchObject({
      layoutCode: "A1",
      positionType: { code: "END" },
      landAreaSqft: 2530,
      basePrice: 1393800,
    });
  });
});