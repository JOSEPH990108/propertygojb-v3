import { readFileSync, writeFileSync } from "node:fs";

const sourcePath = "C:/Users/chong/Downloads/elora-2a-project-source-data.json";
const outputPath = "docs/imports/elora-2a-project-import.json";
const source = JSON.parse(readFileSync(sourcePath, "utf8"));

const descending = (start, end) => Array.from({ length: start - end + 1 }, (_, index) => String(start - index));
const ascending = (start, end) => Array.from({ length: end - start + 1 }, (_, index) => String(start + index));

const section2Rows = [
  ascending(981, 1000),
  descending(1020, 1001),
  ascending(1021, 1044),
  descending(1068, 1045),
  ascending(1069, 1092),
  descending(1116, 1093),
];

const section1Rows = [
  ascending(1299, 1314),
  descending(1330, 1315),
  ascending(1331, 1346),
  descending(1362, 1347),
  ["1363", "1364", ...ascending(1365, 1378)],
  descending(1392, 1379),
];

const sitePlanRows = [...section2Rows, ...section1Rows];
const sourceByLot = new Map(source.units.map((unit) => [unit.lotNo, unit]));
const plannedLots = new Set(sitePlanRows.flat());

if (plannedLots.size !== source.units.length || [...plannedLots].some((lotNo) => !sourceByLot.has(lotNo))) {
  throw new Error("Elora site-plan rows do not match the source unit coverage.");
}

function layoutCode(typeCode) {
  return ["C", "C2"].includes(typeCode) ? "SEMI_32X80" : "CLUSTER_32X70";
}

function positionType(position) {
  if (position === "Corner") return { code: "COR", name: "Corner" };
  if (position === "End") return { code: "END", name: "End" };
  return { code: "INTER", name: "Intermediate" };
}

const units = sitePlanRows.flat().map((lotNo, index) => {
  const unit = sourceByLot.get(lotNo);

  return {
    unitNo: unit.lotNo,
    layoutCode: layoutCode(unit.typeCode),
    lotType: { code: "MIXED", name: "Mixed" },
    bookingStatus: { code: "UNVERIFIED", name: "Availability Pending" },
    blockCode: unit.sitePlan.section,
    displaySequence: index + 1,
    builtUpSqft: unit.builtUpAreaSqft,
    landAreaSqft: unit.totalLandSqft,
    dimensionText: unit.lotSize.display,
    facing: null,
    facingType: unit.orientation,
    positionType: positionType(unit.position),
    carparkCount: 2,
    basePrice: unit.pricing.spaPrice,
    finalPrice: unit.pricing.spaPrice,
  };
});

const payload = {
  version: 1,
  type: "project-import",
  mode: "upsert",
  project: {
    name: "ELORA @ Riveria Garden",
    legalName: "Bandar Wawari - Phase 2A",
    slug: "riveria-garden-wawari-elora",
    developerName: source.project.developer.name,
    propertyCategory: { code: "RESIDENTIAL", name: "Residential" },
    propertyType: { code: "LANDED_HOUSE", name: "Landed House" },
    tenureType: { code: "FREEHOLD", name: "Freehold" },
    projectStatus: { code: "NEW_LAUNCH", name: "New Launch" },
    totalUnits: source.units.length,
    launchYear: 2026,
    isHotDeal: false,
    isPublished: true,
    location: { country: "Malaysia", state: "Johor", region: "Iskandar Puteri", area: "Bandar Wawari", address: null },
  },
  layouts: [
    { code: "CLUSTER_32X70", name: "Double Storey Cluster House", layoutType: { code: "STANDARD", name: "Standard" }, builtUpSqft: 2592, bedrooms: 4, bathrooms: 4, studyRooms: 0 },
    { code: "SEMI_32X80", name: "Double Storey Semi-Detached House", layoutType: { code: "STANDARD", name: "Standard" }, builtUpSqft: 2470, bedrooms: 4, bathrooms: 4, studyRooms: 0 },
  ],
  units,
  amenities: ["Gated and Guarded", "Show Units"],
  tags: ["Freehold", "New Launch", "Elora 2A"],
  nearbyPlaces: [],
  availabilityPlans: [{
    towerCode: "PHASE_2A",
    plan: {
      sitePlan: {
        zoneCode: "ELORA 2A",
        title: "Elora 2A Live Site Plan",
        tabs: [{ code: "ALL", label: "All residences", layoutCodes: ["CLUSTER_32X70", "SEMI_32X80"] }],
        rowGroups: [
          { code: "ELORA_2A_2", label: "Elora 2A(2)", rows: section2Rows },
          { code: "ELORA_2A_1", label: "Elora 2A(1)", rows: section1Rows },
        ],
        maps: [{
          tabCode: "ALL",
          markerRadius: 12,
          hitRadius: 22,
          lots: sitePlanRows.flat().map((unitNo, index) => ({ unitNo, xNorm: (index % 20) / 20, yNorm: Math.floor(index / 20) / 12 })),
        }],
      },
    },
  }],
};

writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);

console.log(JSON.stringify({ outputPath, units: units.length, availability: "UNVERIFIED", section2Rows: section2Rows.length, section1Rows: section1Rows.length }, null, 2));