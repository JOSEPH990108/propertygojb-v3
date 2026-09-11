import fs from "node:fs";

import { previewProjectImport } from "../src/lib/admin/imports/project-import-executor";
import { parseProjectImportPayload } from "../src/lib/admin/imports/project-import-schema";

const payload = JSON.parse(
  fs.readFileSync("./docs/imports/greenone-phase1-project-import.json", "utf8"),
);

const parsed = parseProjectImportPayload(payload);
const layoutCounts = parsed.units.reduce((acc, unit) => {
  const key = unit.layoutCode ?? "NULL";
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

const badNames = parsed.layouts.filter(
  (layout) =>
    !layout.name.includes("Intermediate") &&
    !layout.name.includes("Corner") &&
    !layout.name.includes("End"),
);

const preview = await previewProjectImport(parsed);

console.log(
  JSON.stringify(
    {
      project: parsed.project.name,
      layoutDefs: parsed.layouts.length,
      layoutNames: parsed.layouts.map((layout) => layout.name),
      layoutCounts,
      hasBookingField: parsed.units.filter((unit) =>
        Object.prototype.hasOwnProperty.call(unit, "bookingStatus"),
      ).length,
      launchYear: parsed.project.launchYear ?? null,
      badLayoutNames: badNames.length,
      preview,
    },
    null,
    2,
  ),
);
