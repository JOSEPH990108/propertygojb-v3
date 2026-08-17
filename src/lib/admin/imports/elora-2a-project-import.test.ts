import eloraImport from "../../../../docs/imports/elora-2a-project-import.json";
import { describe, expect, it } from "vitest";

import { parseProjectImportPayload } from "./project-import-schema";

describe("Elora 2A import dataset", () => {
  it("keeps all source units as availability pending until a status source is supplied", () => {
    const payload = parseProjectImportPayload(eloraImport);

    expect(payload.units).toHaveLength(230);
    expect(payload.units.every((unit) => unit.bookingStatus !== null && typeof unit.bookingStatus === "object" && unit.bookingStatus.code === "UNVERIFIED")).toBe(true);
  });

  it("retains exact Phase 2A site-plan coverage and selling prices", () => {
    const payload = parseProjectImportPayload(eloraImport);
    const sitePlan = payload.availabilityPlans[0]?.plan.sitePlan;
    const rowGroups = sitePlan?.rowGroups ?? [];

    expect(rowGroups.map((group) => group.rows.flat().length)).toEqual([136, 94]);
    expect(rowGroups.map((group) => group.rows.length)).toEqual([6, 6]);
    expect(new Set(rowGroups.flatMap((group) => group.rows).flat()).size).toBe(230);
    expect(rowGroups[0]?.rows).toEqual([
      Array.from({ length: 20 }, (_, index) => String(981 + index)),
      Array.from({ length: 20 }, (_, index) => String(1020 - index)),
      Array.from({ length: 24 }, (_, index) => String(1021 + index)),
      Array.from({ length: 24 }, (_, index) => String(1068 - index)),
      Array.from({ length: 24 }, (_, index) => String(1069 + index)),
      Array.from({ length: 24 }, (_, index) => String(1116 - index)),
    ]);
    expect(rowGroups[1]?.rows.slice(-2)).toEqual([
      ["1363", "1364", ...Array.from({ length: 14 }, (_, index) => String(1365 + index))],
      Array.from({ length: 14 }, (_, index) => String(1392 - index)),
    ]);
    expect(payload.units.find((unit) => unit.unitNo === "981")).toMatchObject({
      basePrice: 1525800,
      finalPrice: 1525800,
      positionType: { code: "END" },
      facingType: { code: "N" },
    });
    expect(payload.units.find((unit) => unit.unitNo === "1363")).toMatchObject({
      layoutCode: "SEMI_32X80",
      basePrice: 1887800,
    });
  });
});