import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const downloadsPath = "C:/Users/chong/Downloads";
const pricingWorkbook = `${downloadsPath}/VISTARA HILLS AVAILABLE UNITS LISTING.xlsx`;
const allocationWorkbook = `${downloadsPath}/Vistara Residence master listing (lawyer allocation).xlsx`;
const outputPath = "docs/imports/vistara-residence-project-import.json";

function readWorkbookRows(filePath) {
  const readEntry = (entry) => execFileSync("unzip", ["-p", filePath, entry], { encoding: "utf8" });
  const sharedStrings = [...readEntry("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) =>
    [...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((text) => text[1].replace(/&amp;/g, "&")).join(""),
  );

  return [...readEntry("xl/worksheets/sheet1.xml").matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((row) => {
    const result = {};

    for (const cell of row[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const column = (cell[1].match(/ r="([A-Z]+)/) ?? [])[1];
      const value = (cell[2].match(/<v>([\s\S]*?)<\/v>/) ?? [])[1] ?? "";

      if (column) {
        result[column] = /t="s"/.test(cell[1]) ? sharedStrings[Number(value)] : value;
      }
    }

    return result;
  });
}

function numericUnit(value) {
  return String(value ?? "").replace(/\.0$/, "");
}

function getBookingStatus(allocation) {
  if (allocation.G === "SP SAM" && allocation.H === "PDG LOAN") {
    return { code: "AVAILABLE", name: "Available" };
  }

  if (allocation.G === "SP SAM" && allocation.H === "LOAN APPROVED, SIGNED") {
    return { code: "SPA_SIGNED", name: "SPA Signed" };
  }

  if (allocation.G === "SP SAM" && allocation.H === "LOAN APPROVED, PDG SIGNING") {
    return { code: "BOOKING", name: "Booking" };
  }

  return { code: "UNAVAILABLE", name: "Unavailable" };
}

const pricingByUnit = new Map(
  readWorkbookRows(pricingWorkbook)
    .filter((row) => /^\d+$/.test(numericUnit(row.A)))
    .map((row) => [numericUnit(row.B), row]),
);
const allocations = readWorkbookRows(allocationWorkbook).filter((row) => /^\d+$/.test(row.A ?? ""));

const sitePlanRows = [];
for (const start of [170313, 170337, 170361, 170385, 170409]) {
  for (let rowOffset = 0; rowOffset < 12; rowOffset += 1) {
    sitePlanRows.push([String(start + 11 - rowOffset), String(start + 23 - rowOffset)]);
  }
}

const units = allocations.map((allocation, index) => {
  const unitNo = numericUnit(allocation.B);
  const pricing = pricingByUnit.get(unitNo);
  const positionType = allocation.E === "CL"
    ? { code: "COR", name: "Corner" }
    : allocation.E === "EL"
      ? { code: "END", name: "End" }
      : { code: "INTER", name: "Intermediate" };

  return {
    unitNo,
    layoutCode: allocation.C,
    lotType: allocation.F === "BUMI"
      ? { code: "BUMIPUTERA", name: "Bumiputera" }
      : { code: "NON_BUMIPUTERA", name: "Non-Bumiputera" },
    bookingStatus: getBookingStatus(allocation),
    displaySequence: index + 1,
    builtUpSqft: pricing ? Number(pricing.E) : 3155.76,
    dimensionText: allocation.D.replace(/'/g, " ft"),
    positionType,
    basePrice: pricing ? Number(pricing.F) : 0,
    finalPrice: pricing ? Number(pricing.G) : null,
  };
});

const payload = {
  version: 1,
  type: "project-import",
  mode: "upsert",
  project: {
    name: "Vistara Residence",
    slug: "vistara-residence",
    developerName: "Marcus Group",
    propertyCategory: { code: "LANDED", name: "Landed" },
    propertyType: { code: "CLUSTER_HOUSE", name: "Cluster House" },
    tenureType: { code: "LEASEHOLD_99", name: "Leasehold 99" },
    projectStatus: { code: "COMING_SOON", name: "Coming Soon" },
    totalUnits: units.length,
    isPublished: true,
    location: {
      country: "Malaysia",
      state: "Johor",
      region: "Johor Bahru",
      area: "Taman Bukit Skudai",
      address: "Taman Bukit Skudai",
    },
  },
  layouts: [
    { code: "A1", name: "Type A1", layoutType: { code: "CLUSTER", name: "Cluster" }, builtUpSqft: 3155.76, bedrooms: 4, bathrooms: 4 },
    { code: "A2", name: "Type A2", layoutType: { code: "CLUSTER", name: "Cluster" }, builtUpSqft: 3155.76, bedrooms: 4, bathrooms: 4 },
  ],
  units,
  amenities: ["Gated Community"],
  tags: ["Free MOT", "8% Rebate", "Free Legal Fee SPA & LA"],
  nearbyPlaces: [],
  availabilityPlans: [{
    towerCode: "SITE_PLAN",
    plan: {
      sitePlan: {
        zoneCode: "VISTARA",
        title: "Vistara Residence Live Site Plan",
        tabs: [{ code: "ALL", label: "All residences", layoutCodes: ["A1", "A2"] }],
        rowGroups: Array.from({ length: 5 }, (_, index) => ({
          code: `BLOCK_${index + 1}`,
          label: `Block ${index + 1}`,
          rows: sitePlanRows.slice(index * 12, (index + 1) * 12),
        })),
        maps: [{
          tabCode: "ALL",
          markerRadius: 12,
          hitRadius: 22,
          lots: sitePlanRows.flat().map((unitNo, index) => ({
            unitNo,
            xNorm: (index % 24) / 24,
            yNorm: Math.floor(index / 24) / 5,
          })),
        }],
      },
    },
  }],
};

writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);

const statusCounts = units.reduce((counts, unit) => {
  counts[unit.bookingStatus.code] = (counts[unit.bookingStatus.code] ?? 0) + 1;
  return counts;
}, {});

console.log(JSON.stringify({ outputPath, units: units.length, pricedUnits: pricingByUnit.size, statusCounts }, null, 2));