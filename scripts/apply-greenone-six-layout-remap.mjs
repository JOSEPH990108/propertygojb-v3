import fs from "node:fs";

const targetPath = "docs/imports/greenone-phase1-project-import.json";
const mappingPath = "C:/Users/chong/Downloads/greenone-six-layout-unit-mapping.json";

const target = JSON.parse(fs.readFileSync(targetPath, "utf8"));
const mapping = JSON.parse(fs.readFileSync(mappingPath, "utf8"));

const newLayouts = [
  {
    code: "20X70-INTER",
    name: "20x70 Intermediate Lot",
    builtUpSqft: 1090.17,
    bedrooms: 3,
    bathrooms: 2,
    studyRooms: 0,
    hasYard: true,
    hasBalcony: false,
    isDualKey: false,
    ceilingHeightM: 3.3,
  },
  {
    code: "20X70-CORNER",
    name: "20x70 Corner Lot",
    builtUpSqft: 1136.24,
    bedrooms: 3,
    bathrooms: 2,
    studyRooms: 0,
    hasYard: true,
    hasBalcony: false,
    isDualKey: false,
    ceilingHeightM: 3.3,
  },
  {
    code: "20X70-END",
    name: "20x70 End Lot",
    builtUpSqft: 1136.24,
    bedrooms: 3,
    bathrooms: 2,
    studyRooms: 0,
    hasYard: true,
    hasBalcony: false,
    isDualKey: false,
    ceilingHeightM: 3.3,
  },
  {
    code: "22X70-INTER",
    name: "22x70 Intermediate Lot",
    builtUpSqft: 1199.21,
    bedrooms: 3,
    bathrooms: 2,
    studyRooms: 0,
    hasYard: true,
    hasBalcony: false,
    isDualKey: false,
    ceilingHeightM: 3.3,
  },
  {
    code: "22X70-CORNER",
    name: "22x70 Corner Lot",
    builtUpSqft: 1245.69,
    bedrooms: 3,
    bathrooms: 2,
    studyRooms: 0,
    hasYard: true,
    hasBalcony: false,
    isDualKey: false,
    ceilingHeightM: 3.3,
  },
  {
    code: "22X70-END",
    name: "22x70 End Lot",
    builtUpSqft: 1245.69,
    bedrooms: 3,
    bathrooms: 2,
    studyRooms: 0,
    hasYard: true,
    hasBalcony: false,
    isDualKey: false,
    ceilingHeightM: 3.3,
  },
];

const linkByUnitNo = new Map(mapping.unitLinks.map((row) => [String(row.unitNo), row]));

// Retain project-level correction: 2028 is completion year, not launch year.
if ("launchYear" in target.project) {
  delete target.project.launchYear;
}

// Replace layouts with exactly six definitions.
target.layouts = newLayouts;

const unmapped = [];
for (const unit of target.units) {
  const link = linkByUnitNo.get(String(unit.unitNo));
  if (!link) {
    unmapped.push(unit.unitNo);
    continue;
  }

  unit.layoutCode = link.newLayoutCode;

  // Keep booking status omitted by not adding it.
  if (Object.prototype.hasOwnProperty.call(unit, "bookingStatus")) {
    delete unit.bookingStatus;
  }
}

const duplicatesInMap = (() => {
  const seen = new Set();
  const dups = new Set();
  for (const row of mapping.unitLinks) {
    const key = String(row.unitNo);
    if (seen.has(key)) {
      dups.add(key);
    }
    seen.add(key);
  }
  return [...dups];
})();

fs.writeFileSync(targetPath, `${JSON.stringify(target, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      updatedFile: targetPath,
      layoutCount: target.layouts.length,
      unitCount: target.units.length,
      linksCount: mapping.unitLinks.length,
      unmapped,
      duplicateUnitsInMapping: duplicatesInMap,
    },
    null,
    2,
  ),
);
