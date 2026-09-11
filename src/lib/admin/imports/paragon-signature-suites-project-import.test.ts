import paragonImport from "../../../../docs/imports/paragon-signature-suites-project-import.json";
import { describe, expect, it } from "vitest";

import { parseProjectImportPayload } from "./project-import-schema";

describe("Paragon Signature Suites import dataset", () => {
  it("parses with the screenshot-faithful Tower A availability plan", () => {
    const parsed = parseProjectImportPayload(paragonImport);
    const plan = parsed.availabilityPlans.find((item) => item.towerCode === "A")?.plan;

    expect(plan?.physicalStacks).toEqual([
      "06", "05", "03", "02", "01", "25", "23", "22", "21", "20", "19",
      "18", "17", "16", "15", "13", "12", "11", "10", "09", "08", "07",
    ]);
    expect(plan?.floorOverrides).toEqual({});
  });

  it("keeps the current 98-unit company allocation and 386 unavailable units", () => {
    const statusCounts = paragonImport.units.reduce((counts, unit) => {
      const code = unit.bookingStatus?.code ?? "MISSING";
      counts[code] = (counts[code] ?? 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    expect(paragonImport.project.isPublished).toBe(true);
    expect(paragonImport.units).toHaveLength(484);
    expect(statusCounts).toMatchObject({
      AVAILABLE: 60,
      SPA_SIGNED: 37,
      APPROVED: 1,
      NOT_AVAILABLE: 386,
    });
  });
});