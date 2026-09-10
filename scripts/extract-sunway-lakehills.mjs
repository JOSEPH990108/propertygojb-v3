import fs from "node:fs";

const token = process.env.SUNWAY_TOKEN;
if (!token) {
  throw new Error("SUNWAY_TOKEN is required");
}

const phaseId = 15;
const apiBase = "https://balloting-api.sunwayproperty.com/v1";

async function getJson(path) {
  const res = await fetch(`${apiBase}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Request failed ${res.status} ${path}: ${txt.slice(0, 500)}`);
  }

  return res.json();
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeFacing(value) {
  if (!value) {
    return null;
  }
  return String(value).trim().replace(/\s+/g, "_").replace(/-/g, "_").toUpperCase();
}

function mapLotType(value) {
  if (value === "bumiputra") {
    return { code: "BUMIPUTERA", name: "Bumiputera" };
  }
  if (value === "open-market") {
    return { code: "NON_BUMIPUTERA", name: "Non-Bumiputera" };
  }
  return { code: "MIXED", name: "Mixed" };
}

function mapBookingStatus(value) {
  if (value === "open") {
    return { code: "AVAILABLE", name: "Available" };
  }
  if (value === "reserved") {
    return { code: "BOOKING", name: "Booking" };
  }
  const normalized = String(value || "UNKNOWN").trim().replace(/\s+/g, "_").toUpperCase();
  const name = normalized
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return { code: normalized, name };
}

function parseCarparkCount(value) {
  const match = String(value || "").match(/\d+/);
  if (!match) {
    return 1;
  }
  return Number(match[0]);
}

function normalizeUnitNo(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s*-\s*/g, "-");
}

const physicalUnitNoRemaps = new Map([
  // Verified against the live Sunway SVG plan: these source labels occupy the 08/09 positions.
  ["B-22-03", "B-22-08"],
  ["B-22-05", "B-22-09"],
]);

function applyPhysicalUnitNoRemap(unitNo) {
  const normalizedUnitNo = normalizeUnitNo(unitNo);
  return physicalUnitNoRemaps.get(normalizedUnitNo) ?? normalizedUnitNo;
}

function sourceUnitQuality(unit) {
  const sourceUnitNo = String(unit.unit_no || "").trim().toUpperCase();
  const hasCanonicalUnitNo = sourceUnitNo === normalizeUnitNo(sourceUnitNo) ? 1 : 0;
  const hasPrice = Number(unit.preview_price ?? unit.listing_price ?? 0) > 0 ? 1 : 0;
  return hasCanonicalUnitNo * 2 + hasPrice;
}

function parseUnitNo(unitNo) {
  const normalizedUnitNo = applyPhysicalUnitNoRemap(unitNo);
  const match = normalizedUnitNo.match(/^([A-Z]+)-(\d{2})-(\d{2})$/);
  if (!match) {
    return {
      tower: "UNKNOWN",
      floor: null,
      stack: null,
      sequenceKey: `ZZ-${normalizedUnitNo}`,
    };
  }

  const tower = match[1];
  const floor = Number(match[2]);
  const stack = match[3];
  const sequenceKey = `${tower}-${String(floor).padStart(2, "0")}-${stack}`;

  return { tower, floor, stack, sequenceKey };
}

const [unitsPayload, phasesPayload, layoutTypesPayload] = await Promise.all([
  getJson(`/units?per_page=99999&include%5B%5D=layout_type.*&include%5B%5D=layout_shape.*&include%5B%5D=phase.*&filter%7Bphase%7D=${phaseId}`),
  getJson("/phases?per_page=99999&include%5B%5D=township.*"),
  getJson(`/layout-types?per_page=99999&filter%7Bphase%7D=${phaseId}`),
]);

const units = unitsPayload.units || [];
const phases = phasesPayload.phases || [];
const townships = phasesPayload.townships || [];
const layoutTypes = layoutTypesPayload["layout-types"] || [];

const phase = phases.find((item) => item.id === phaseId);
if (!phase) {
  throw new Error(`Phase ${phaseId} not found`);
}

const township = townships.find((item) => item.id === phase.township) || null;

const layoutTypeById = new Map(layoutTypes.map((item) => [item.id, item]));

const layoutStats = new Map();
for (const unit of units) {
  const layoutId = unit.layout_type;
  const code = layoutTypeById.get(layoutId)?.code || `LAYOUT_${layoutId}`;
  if (!layoutStats.has(layoutId)) {
    layoutStats.set(layoutId, {
      layoutId,
      code,
      builtUpSqft: unit.built_up_area || 0,
      carparks: parseCarparkCount(unit.car_park),
      units: 0,
      hasBalcony: false,
      hasYard: false,
    });
  }
  const stat = layoutStats.get(layoutId);
  stat.units += 1;
  if (!stat.builtUpSqft && unit.built_up_area) {
    stat.builtUpSqft = unit.built_up_area;
  }
  if ((!stat.carparks || stat.carparks <= 0) && unit.car_park) {
    stat.carparks = parseCarparkCount(unit.car_park);
  }
}

const sortedLayouts = Array.from(layoutStats.values()).sort((a, b) => a.code.localeCompare(b.code));

const normalizedUnitsByUnitNo = new Map();
const duplicateUnitNos = [];

for (const unit of units) {
  const unitNo = applyPhysicalUnitNoRemap(unit.unit_no);
  const existingUnit = normalizedUnitsByUnitNo.get(unitNo);

  if (existingUnit) {
    const shouldReplace = sourceUnitQuality(unit) > sourceUnitQuality(existingUnit);
    duplicateUnitNos.push({
      unitNo,
      sourceUnitNos: [existingUnit.unit_no, unit.unit_no],
      retainedSourceUnitNo: shouldReplace ? unit.unit_no : existingUnit.unit_no,
    });
    if (shouldReplace) {
      normalizedUnitsByUnitNo.set(unitNo, unit);
    }
    continue;
  }

  normalizedUnitsByUnitNo.set(unitNo, unit);
}

const normalizedUnits = Array.from(normalizedUnitsByUnitNo.values())
  .map((unit) => {
    const unitNo = applyPhysicalUnitNoRemap(unit.unit_no);
    const parsed = parseUnitNo(unitNo);
    const layoutCode = layoutTypeById.get(unit.layout_type)?.code || `LAYOUT_${unit.layout_type}`;
    return {
      raw: unit,
      unitNo,
      parsed,
      layoutCode,
    };
  })
  .sort((a, b) => a.parsed.sequenceKey.localeCompare(b.parsed.sequenceKey));

const importUnits = normalizedUnits.map((entry, index) => {
  const unit = entry.raw;
  return {
    unitNo: entry.unitNo,
    layoutCode: entry.layoutCode,
    lotType: mapLotType(unit.bumiputra_status),
    bookingStatus: mapBookingStatus(unit.status),
    floor: entry.parsed.floor,
    stack: entry.parsed.stack,
    streetName: null,
    displaySequence: index + 1,
    builtUpSqft: parseNumber(unit.built_up_area),
    landAreaSqft: parseNumber(unit.land_area),
    dimensionText: unit.lot_size || null,
    facing: normalizeFacing(unit.facing_direction),
    positionType: null,
    carparkCount: parseCarparkCount(unit.car_park),
    carparkLotNo: null,
    carparkType: unit.car_park || null,
    basePrice: parseNumber(unit.listing_price) ?? 0,
    finalPrice: parseNumber(unit.preview_price),
  };
});

const importLayouts = sortedLayouts.map((layout) => ({
  code: layout.code,
  name: `Layout ${layout.code}`,
  layoutType: { code: "STANDARD", name: "Standard" },
  builtUpSqft: layout.builtUpSqft || 1,
  bedrooms: 0,
  bathrooms: 0,
  studyRooms: 0,
  hasBalcony: layout.hasBalcony,
  hasYard: layout.hasYard,
  isDualKey: false,
  ceilingHeightM: null,
  furnishingStatus: "UNFURNISHED",
}));

const importPayload = {
  version: 1,
  type: "project-import",
  mode: "upsert",
  project: {
    name: "Sunway Lakehills Phase 1",
    legalName: phase.name,
    slug: "sunway-lakehills-phase-1",
    developerName: "Sunway Property",
    propertyCategory: { code: "HIGH_RISE", name: "High Rise" },
    propertyType: { code: "SERVICED_APT", name: "Serviced Apartment" },
    tenureType: { code: "UNKNOWN", name: "Unknown" },
    projectStatus: null,
    totalUnits: importUnits.length,
    launchYear: phase.launch_at ? Number(String(phase.launch_at).slice(0, 4)) : null,
    completionText: null,
    isHotDeal: false,
    isPublished: false,
    location: {
      country: "Malaysia",
      state: "Johor",
      region: "Johor Bahru",
      area: township?.name || "Sunway Lakehills",
      address: null,
    },
  },
  layouts: importLayouts,
  units: importUnits,
  amenities: [],
  tags: [
    "source-sunway-obs",
    "phase-lh-ph1",
    "auto-extracted",
    "status-open-reserved",
  ],
  nearbyPlaces: [],
};

const extractionPayload = {
  extractedAt: new Date().toISOString(),
  source: {
    system: "Sunway Property Booking System",
    phaseId,
    phaseCode: phase.code,
    townshipCode: township?.code || null,
  },
  project: {
    phase,
    township,
  },
  layoutTypes,
  units,
  summaries: {
    unitCount: units.length,
    normalizedUnitCount: importUnits.length,
    duplicateUnitNos,
    physicalUnitNoRemaps: Array.from(
      physicalUnitNoRemaps,
      ([sourceUnitNo, importedUnitNo]) => ({ sourceUnitNo, importedUnitNo }),
    ),
    towerCounts: units.reduce((acc, unit) => {
      const parsed = parseUnitNo(unit.unit_no);
      acc[parsed.tower] = (acc[parsed.tower] || 0) + 1;
      return acc;
    }, {}),
    statusCounts: units.reduce((acc, unit) => {
      const key = unit.status || "UNKNOWN";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
    layoutCounts: importUnits.reduce((acc, unit) => {
      const key = unit.layoutCode;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  },
};

fs.writeFileSync(
  "docs/imports/sunway-lakehills-phase1-units-extracted.json",
  `${JSON.stringify(extractionPayload, null, 2)}\n`,
);

fs.writeFileSync(
  "docs/imports/sunway-lakehills-project-import.json",
  `${JSON.stringify(importPayload, null, 2)}\n`,
);

console.log(
  JSON.stringify(
    {
      extractedFile: "docs/imports/sunway-lakehills-phase1-units-extracted.json",
      importFile: "docs/imports/sunway-lakehills-project-import.json",
      unitCount: importUnits.length,
      towerCounts: extractionPayload.summaries.towerCounts,
      statusCounts: extractionPayload.summaries.statusCounts,
      layoutCounts: extractionPayload.summaries.layoutCounts,
      layoutCodes: importLayouts.map((item) => item.code),
    },
    null,
    2,
  ),
);
