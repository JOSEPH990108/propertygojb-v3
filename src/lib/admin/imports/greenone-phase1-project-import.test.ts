import greenOneImport from "../../../../docs/imports/greenone-phase1-project-import.json";
import { describe, expect, it } from "vitest";

import { parseProjectImportPayload } from "./project-import-schema";

describe("Green One Phase 1 import dataset", () => {
  it("defines the clone-ready Zone 4B live site plan", () => {
    const parsed = parseProjectImportPayload(greenOneImport);
    const sitePlan = parsed.availabilityPlans.find((item) => item.towerCode === "ZONE_4B")?.plan.sitePlan;

    expect(parsed.project.isPublished).toBe(true);
    expect(sitePlan).toMatchObject({
      zoneCode: "4B",
      title: "Zone 4B Live Site Plan",
    });
    expect(sitePlan?.tabs).toEqual([
      {
        code: "20X70",
        label: "20 x 70",
        layoutCodes: ["20X70_INTER", "20X70_END", "20X70_CORNER"],
      },
      {
        code: "22X70",
        label: "22 x 70",
        layoutCodes: ["22X70_INTER", "22X70_END", "22X70_CORNER"],
      },
    ]);
    expect(sitePlan?.maps).toMatchObject([
      {
        tabCode: "20X70",
      },
      {
        tabCode: "22X70",
      },
    ]);
    expect(sitePlan?.maps?.map((map) => map.lots).flat()).toHaveLength(369);
  });

  it("uses the latest masterplan availability snapshot", () => {
    const countsByDimension = greenOneImport.units.reduce((counts, unit) => {
      const dimension = unit.dimensionText ?? "MISSING";
      const status = unit.bookingStatus?.code ?? "MISSING";
      const summary = counts[dimension] ?? { AVAILABLE: 0, SOLD: 0 };

      if (status === "AVAILABLE" || status === "SOLD") {
        summary[status] += 1;
      }

      counts[dimension] = summary;
      return counts;
    }, {} as Record<string, { AVAILABLE: number; SOLD: number }>);

    expect(countsByDimension).toEqual({
      "20x70": { AVAILABLE: 136, SOLD: 83 },
      "22x70": { AVAILABLE: 119, SOLD: 31 },
    });
  });
});