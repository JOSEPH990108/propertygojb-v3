import sunwayImport from "../../../../docs/imports/sunway-lakehills-project-import.json";
import { describe, expect, it } from "vitest";

import { parseProjectImportPayload } from "./project-import-schema";

const expectedViewByFacing = {
  NW: "LAKE_GOLF_CITY_VIEW",
  SW: "LAKE_GOLF_CITY_VIEW",
  SE: "SINGAPORE_VIEW",
  NE: "FACILITIES_VIEW",
} as const;

describe("Sunway Lakehills import dataset", () => {
  it("parses successfully against project import schema", () => {
    expect(() => parseProjectImportPayload(sunwayImport)).not.toThrow();
  });

  it("stores each view independently from its canonical directional facing", () => {
    for (const unit of sunwayImport.units) {
      const expectedView = expectedViewByFacing[
        unit.facingType?.code as keyof typeof expectedViewByFacing
      ];

      expect(expectedView).toBeDefined();
      expect(unit.positionType).toBeNull();
      expect(unit.facing).toBeNull();
      expect(unit.viewType?.code).toBe(expectedView);
    }
  });
});