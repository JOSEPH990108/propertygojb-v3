import elmoraImport from "../../../../docs/imports/elmora-iib-project-import.json";
import elmoraReference from "../../../../elmora-copilot-reference-data.json";
import { describe, expect, it } from "vitest";

import { parseProjectImportPayload } from "./project-import-schema";

type BookingStatusCode = "AVAILABLE" | "SOLD";

function toCents(value: number) {
  return Math.round(value * 100);
}

describe("Elmora IIB import dataset", () => {
  it("parses successfully against project import schema", () => {
    expect(() => parseProjectImportPayload(elmoraImport)).not.toThrow();
  });

  it("marks all Block B unit availability as unverified", () => {
    const blockBUnits = elmoraImport.units.filter((unit) => unit.unitNo.startsWith("B-"));

    expect(blockBUnits.length).toBe(
      elmoraReference.validationTargets.unitsPerBlock.B,
    );

    for (const unit of blockBUnits) {
      expect(unit.bookingStatus).toEqual({
        code: "UNVERIFIED",
        name: "Availability Pending",
      });
    }
  });

  it("keeps exact Block A booking-status counts from verified source", () => {
    const blockAUnits = elmoraImport.units.filter((unit) => unit.unitNo.startsWith("A-"));
    const statusCounts: Record<BookingStatusCode, number> = {
      AVAILABLE: 0,
      SOLD: 0,
    };

    for (const unit of blockAUnits) {
      const code = unit.bookingStatus?.code as BookingStatusCode | undefined;
      if (code === "AVAILABLE" || code === "SOLD") {
        statusCounts[code] += 1;
      }
    }

    expect(statusCounts.AVAILABLE).toBe(
      elmoraReference.validationTargets.blockAAvailabilityTotals.AVAILABLE,
    );
    expect(statusCounts.SOLD).toBe(
      elmoraReference.validationTargets.blockAAvailabilityTotals.SOLD,
    );
  });

  it("stores each unit view separately from its physical position and facing", () => {
    for (const unit of elmoraImport.units) {
      expect(unit.positionType).toBeNull();
      expect(unit.facing).toBeNull();
      expect(["RIVER_VIEW", "FACILITIES_VIEW"]).toContain(unit.viewType?.code);
      expect(unit.viewType?.name).toBe(
        unit.viewType?.code === "FACILITIES_VIEW" ? "Facilities View" : "River View",
      );
    }
  });

  it("keeps upper-floor unit numbers and views aligned to their fixed columns", () => {
    for (const towerCode of ["A", "B"]) {
      const plan = elmoraImport.availabilityPlans.find((item) => item.towerCode === towerCode)?.plan;
      const floor19Units = elmoraImport.units.filter((unit) => unit.unitNo.startsWith(`${towerCode}-19-`));

      expect(plan?.physicalStacks).toHaveLength(23);
      expect(plan?.floorOverrides).toEqual({});
      expect(floor19Units.map((unit) => unit.stack)).toEqual(
        Array.from({ length: 22 }, (_, index) => String(index + 1).padStart(2, "0")),
      );
      expect(floor19Units.find((unit) => unit.stack === "07")?.viewType?.code).toBe("RIVER_VIEW");
      expect(floor19Units.find((unit) => unit.stack === "17")?.viewType?.code).toBe("FACILITIES_VIEW");
    }
  });

  it("matches combined SPA and net totals using decimal-safe cent arithmetic", () => {
    let totalBasePriceCents = 0;
    let totalFinalPriceCents = 0;

    for (const unit of elmoraImport.units) {
      totalBasePriceCents += toCents(unit.basePrice);
      totalFinalPriceCents += toCents(unit.finalPrice ?? 0);
    }

    expect(totalBasePriceCents).toBe(
      toCents(elmoraReference.validationTargets.combinedSpaPriceTotal),
    );
    expect(totalFinalPriceCents).toBe(
      toCents(elmoraReference.validationTargets.combinedNetPriceTotal),
    );
  });
});
