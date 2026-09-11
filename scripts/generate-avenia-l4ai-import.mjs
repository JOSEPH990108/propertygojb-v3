import { readFileSync, writeFileSync } from "node:fs";

const sourcePath = "C:/Users/chong/Downloads/avenia-l4ai-project-source-data.json";
const outputPath = "docs/imports/avenia-l4ai-project-import.json";
const source = JSON.parse(readFileSync(sourcePath, "utf8"));
const unitNumbers = source.units.map((unit) => unit.ptdNo);
const predictedStripGroups = [
  { code: "NORTH_1", label: "North-facing strip cluster 1", rows: unitNumbers.slice(0, 55) },
  { code: "SOUTH", label: "South-facing strip cluster", rows: unitNumbers.slice(55, 110) },
  { code: "NORTH_2", label: "North-facing strip cluster 2", rows: unitNumbers.slice(110, 165) },
].map((group) => ({
  ...group,
  rows: Array.from({ length: 5 }, (_, index) => group.rows.slice(index * 11, (index + 1) * 11)),
}));
const planRows = predictedStripGroups.flatMap((group) => group.rows);
const sourceByUnitNo = new Map(source.units.map((unit) => [unit.ptdNo, unit]));
const plannedLots = new Set(planRows.flat());

if (plannedLots.size !== source.units.length || [...plannedLots].some((unitNo) => !sourceByUnitNo.has(unitNo))) {
  throw new Error("Avenia site-plan rows do not match source unit coverage.");
}

function positionType(position) {
  if (position === "Corner") return { code: "COR", name: "Corner" };
  if (position === "End") return { code: "END", name: "End" };
  return { code: "INTER", name: "Intermediate" };
}

const layoutDefinitions = {
  A: { name: "Type A", builtUpSqft: 2219 },
  A1: { name: "Type A1", builtUpSqft: 2219 },
  A2: { name: "Type A2", builtUpSqft: 2345 },
};

const payload = {
  version: 1,
  type: "project-import",
  mode: "upsert",
  project: {
    name: source.project.name,
    legalName: source.project.name,
    slug: "avenia-l4ai",
    developerName: source.project.developer.normalizedName,
    propertyCategory: { code: "RESIDENTIAL", name: "Residential" },
    propertyType: { code: "TERRACE_HOUSE", name: "Terrace House" },
    tenureType: { code: "FREEHOLD", name: "Freehold" },
    projectStatus: { code: "NEW_LAUNCH", name: "New Launch" },
    totalUnits: source.units.length,
    launchYear: 2026,
    isHotDeal: false,
    isPublished: true,
    location: { country: "Malaysia", state: "Johor", region: "Johor Bahru", area: "Pulai", address: null },
  },
  layouts: Object.entries(layoutDefinitions).map(([code, layout]) => ({
    code,
    name: layout.name,
    layoutType: { code: "STANDARD", name: "Standard" },
    builtUpSqft: layout.builtUpSqft,
    bedrooms: source.project.bedrooms,
    bathrooms: source.project.bathrooms,
    studyRooms: 0,
  })),
  units: planRows.flat().map((unitNo, index) => {
    const unit = sourceByUnitNo.get(unitNo);
    return {
      unitNo,
      layoutCode: unit.typeCode,
      lotType: { code: "MIXED", name: "Mixed" },
      bookingStatus: { code: "UNVERIFIED", name: "Availability Pending" },
      blockCode: "L4(A)(I)",
      displaySequence: index + 1,
      builtUpSqft: unit.builtUpAreaSqft,
      landAreaSqft: unit.land.totalLotAreaSqft,
      dimensionText: unit.land.approximateDimensionsDisplay,
      facing: null,
      facingType: unit.orientation,
      positionType: positionType(unit.position),
      carparkCount: source.project.parkingLots,
      basePrice: unit.pricing.spaPrice,
      finalPrice: unit.pricing.spaPrice,
    };
  }),
  amenities: ["Gated and Guarded"],
  tags: ["Freehold", "New Launch", "Avenia L4(a)(i)"],
  nearbyPlaces: [],
  availabilityPlans: [{
    towerCode: "L4AI",
    plan: {
      sitePlan: {
        zoneCode: "AVENIA L4(A)(I)",
        title: "Avenia L4(a)(i) Live Site Plan",
        tabs: [{ code: "ALL", label: "All residences", layoutCodes: ["A", "A1", "A2"] }],
        rowGroups: predictedStripGroups,
      },
    },
  }],
};

writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, units: payload.units.length, availability: "UNVERIFIED", stripGroups: predictedStripGroups.length, rows: planRows.length, lotsPerRow: 11 }, null, 2));