import fs from "node:fs";

const importPath = "docs/imports/greenone-phase1-project-import.json";
const refPath = "C:/Users/chong/Downloads/greenone-copilot-reference-data (1).json";

const imp = JSON.parse(fs.readFileSync(importPath, "utf8"));
const ref = JSON.parse(fs.readFileSync(refPath, "utf8"));
const pf = ref.projectFacts;

imp.project.name = "Green One Phase 1";
imp.project.legalName = pf.legalName;
imp.project.slug = "green-one-phase-1";
imp.project.developerName = pf.developer.name;
imp.project.propertyCategory = { code: "LANDED", name: "Landed" };
imp.project.propertyType = { code: "TERRACE", name: "Terrace House" };
imp.project.tenureType = { code: "FREEHOLD", name: "Freehold" };
imp.project.projectStatus = null;
imp.project.totalUnits = pf.totalUnits;
imp.project.launchYear = pf.completion.targetYear;
imp.project.completionText = `${pf.completion.targetYear} ${pf.completion.targetQuarter} (${pf.completion.constructionPeriodMonths} months)`;
imp.project.isHotDeal = false;
imp.project.isPublished = false;
imp.project.location = {
  country: pf.location.country,
  state: pf.location.state,
  region: pf.location.city,
  area: pf.location.township,
  address: pf.location.fullAddress,
};

const layoutByCode = new Map(ref.layoutFacts.map((layout) => [String(layout.code), layout]));
imp.layouts = imp.layouts.map((layout) => {
  const f = layoutByCode.get(String(layout.code));
  if (!f) {
    return layout;
  }

  return {
    ...layout,
    name: f.name ?? layout.name,
    layoutType: { code: "STANDARD", name: "Standard" },
    builtUpSqft: Math.min(...f.unitLevelBuiltUpSqftValues),
    bedrooms: f.bedrooms,
    bathrooms: f.bathrooms,
    studyRooms: 0,
    hasBalcony: false,
    hasYard: false,
    isDualKey: false,
    ceilingHeightM: f.ceilingHeightMeters,
    furnishingStatus: "UNFURNISHED",
  };
});

const refUnitByNo = new Map(ref.units.map((unit) => [String(unit.suggestedUnitNo), unit]));
imp.units = imp.units.map((unit) => {
  const src = refUnitByNo.get(String(unit.unitNo));
  const width = src?.nominalLandDimensionsFeet?.width;
  const depth = src?.nominalLandDimensionsFeet?.depth;

  const next = {
    ...unit,
    streetName: null,
    carparkCount: pf.carparksPerUnit,
    carparkType: "Porch",
    dimensionText: width && depth ? `${width}x${depth}` : unit.dimensionText ?? null,
  };

  delete next.bookingStatus;
  return next;
});

// Use tags for additional confirmed commercial/eligibility metadata because the import schema has no dedicated fields.
imp.tags = [
  "phase-1",
  "developer-alam-heights-sdn-bhd",
  "developer-reg-201601009770",
  "developer-legacy-1180698-a",
  "completion-2028-q2",
  "construction-24-months",
  "maintenance-fee-myr-150-estimate",
  "booking-fee-myr-200-refundable",
  "spa-rebate-10-percent",
  "free-legal-fees-spa-and-loan",
  "free-stamp-duty-loan",
  "free-mot",
  "foreigner-purchase-not-allowed",
];

imp.amenities = [];
imp.nearbyPlaces = [];

fs.writeFileSync(importPath, `${JSON.stringify(imp, null, 2)}\n`);
console.log(`updated ${importPath} units=${imp.units.length} tags=${imp.tags.length}`);
