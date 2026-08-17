import { describe, expect, it } from "vitest";

import vistaraImport from "../../../../docs/imports/vistara-residence-project-import.json";

import { parseProjectImportPayload } from "./project-import-schema";

describe("Vistara Residence import dataset", () => {
  it("applies the GPlex and SP SAM availability rule", () => {
    const payload = parseProjectImportPayload(vistaraImport);
    const counts = payload.units.reduce<Record<string, number>>((result, unit) => {
      const code = typeof unit.bookingStatus === "string" ? unit.bookingStatus : unit.bookingStatus?.code ?? "NONE";
      result[code] = (result[code] ?? 0) + 1;
      return result;
    }, {});

    expect(payload.units).toHaveLength(120);
    expect(counts).toEqual({ AVAILABLE: 42, UNAVAILABLE: 43, BOOKING: 34, SPA_SIGNED: 1 });
  });

  it("retains all five site-plan blocks in paired rows", () => {
    const payload = parseProjectImportPayload(vistaraImport);
    const rowGroups = payload.availabilityPlans[0]?.plan.sitePlan?.rowGroups ?? [];

    expect(rowGroups).toHaveLength(5);
    expect(rowGroups.map((group) => group.rows)).toEqual([
      expect.arrayContaining([["170324", "170336"], ["170313", "170325"]]),
      expect.arrayContaining([["170348", "170360"], ["170337", "170349"]]),
      expect.arrayContaining([["170372", "170384"], ["170361", "170373"]]),
      expect.arrayContaining([["170396", "170408"], ["170385", "170397"]]),
      expect.arrayContaining([["170420", "170432"], ["170409", "170421"]]),
    ]);
  });
});