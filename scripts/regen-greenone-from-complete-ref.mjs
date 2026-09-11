import fs from "node:fs";

const refPath = "C:/Users/chong/Downloads/greenone-complete-copilot-reference.json";
const outPath = "docs/imports/greenone-phase1-project-import.json";

const ref = JSON.parse(fs.readFileSync(refPath, "utf8"));

const layoutTypeBySemantic = {
  INTERMEDIATE: { code: "INTERMEDIATE", name: "Intermediate" },
  CORNER: { code: "CORNER", name: "Corner" },
  END: { code: "END", name: "End Lot" },
};

const lotTypeBySemantic = {
  BUMIPUTERA: { code: "BUMIPUTERA", name: "Bumiputera" },
  NON_BUMIPUTERA: { code: "NON_BUMIPUTERA", name: "Non-Bumiputera" },
};

const unitPositionBySemantic = {
  INTERMEDIATE: { code: "INTER", name: "Intermediate" },
  CORNER: { code: "COR", name: "Corner" },
  END: { code: "EUL", name: "End Unit (Extra Land)" },
};

const projectFacts = ref.projectFacts;

const payload = {
  version: 1,
  type: "project-import",
  mode: "upsert",
  project: {
    name: projectFacts.displayName,
    legalName: projectFacts.legalName,
    slug: projectFacts.slugSuggestion,
    developerName: projectFacts.developer.name,
    propertyCategory: {
      code: projectFacts.propertyCategory.semanticCode,
      name: projectFacts.propertyCategory.name,
    },
    propertyType: {
      // Repository lookup has TERRACE for this landed type.
      code: "TERRACE",
      name: "Terrace House",
    },
    tenureType: {
      code: projectFacts.tenure.semanticCode,
      name: projectFacts.tenure.name,
    },
    projectStatus: null,
    totalUnits: projectFacts.totalUnits,
    launchYear: null,
    completionText: projectFacts.completion.displayText,
    isHotDeal: false,
    isPublished: false,
    location: {
      country: projectFacts.location.country,
      state: projectFacts.location.state,
      region: projectFacts.location.city,
      area: projectFacts.location.area,
      address: projectFacts.location.fullAddress,
    },
  },
  layouts: ref.layouts.map((layout) => ({
    code: layout.code,
    name: layout.name,
    layoutType: layoutTypeBySemantic[layout.layoutType.semanticCode] ?? null,
    builtUpSqft: layout.builtUpSqft,
    bedrooms: layout.bedrooms,
    bathrooms: layout.bathrooms,
    studyRooms: layout.studyRooms,
    hasBalcony: layout.hasBalcony,
    hasYard: Boolean(layout.hasBackyard),
    isDualKey: layout.isDualKey,
    ceilingHeightM: layout.ceilingHeightMeters,
    // Keep furnishing unverified by omitting this field.
  })),
  units: ref.units.map((unit) => ({
    unitNo: unit.unitNo,
    layoutCode: unit.layoutCode,
    lotType: lotTypeBySemantic[unit.lotAllocation.semanticCode] ?? {
      code: unit.lotAllocation.semanticCode,
      name: unit.lotAllocation.name,
    },
    floor: null,
    stack: null,
    streetName: null,
    displaySequence: unit.displaySequence,
    builtUpSqft: unit.builtUp.sqft,
    landAreaSqft: unit.actualLandSize.sqft,
    dimensionText: unit.nominalLandDimensionsFeet.dimensionText,
    facing: unit.facing,
    positionType: unitPositionBySemantic[unit.positionType.semanticCode] ?? {
      code: unit.positionType.sourceCode,
      name: unit.positionType.name,
    },
    carparkCount: unit.accommodation.carparkCount,
    carparkLotNo: null,
    carparkType: unit.accommodation.carparkType,
    basePrice: unit.pricing.spaPriceGdv,
    finalPrice: unit.pricing.netSellingPrice,
    // Keep booking status omitted because availability is unverified.
  })),
  amenities: [],
  tags: [
    "phase-1",
    "maintenance-fee-myr-150-estimate",
    "booking-fee-myr-200-refundable",
    "spa-rebate-10-percent",
    "free-legal-fees-spa-and-loan",
    "free-stamp-duty-loan",
    "free-mot",
    "foreigner-purchase-not-allowed-currently",
  ],
  nearbyPlaces: [],
};

fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      output: outPath,
      layouts: payload.layouts.length,
      units: payload.units.length,
      firstUnit: payload.units[0],
    },
    null,
    2,
  ),
);
