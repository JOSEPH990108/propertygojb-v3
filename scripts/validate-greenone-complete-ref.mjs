import fs from "node:fs";

import { previewProjectImport } from "../src/lib/admin/imports/project-import-executor";
import { parseProjectImportPayload } from "../src/lib/admin/imports/project-import-schema";

const ref = JSON.parse(
  fs.readFileSync("C:/Users/chong/Downloads/greenone-complete-copilot-reference.json", "utf8"),
);
const payload = JSON.parse(
  fs.readFileSync("docs/imports/greenone-phase1-project-import.json", "utf8"),
);

const parsed = parseProjectImportPayload(payload);
const vt = ref.validationTargets;

const countBy = (list, keyFn) =>
  list.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

const sumBy = (list, numFn) => list.reduce((acc, item) => acc + Number(numFn(item) || 0), 0);

const layoutCounts = countBy(parsed.units, (u) => u.layoutCode ?? "NULL");
const unitNoSet = new Set(parsed.units.map((u) => u.unitNo));
const ptdPrefixed = parsed.units.filter((u) => u.unitNo.startsWith("PTD ")).length;
const hsdPrefixed = parsed.units.filter((u) => u.unitNo.startsWith("HSD")).length;
const bookingFieldCount = parsed.units.filter((u) => Object.prototype.hasOwnProperty.call(u, "bookingStatus")).length;

const lotCounts = {
  BUMIPUTERA: parsed.units.filter((u) => u.lotType && typeof u.lotType !== "string" && u.lotType.code === "BUMIPUTERA").length,
  NON_BUMIPUTERA: parsed.units.filter((u) => u.lotType && typeof u.lotType !== "string" && u.lotType.code === "NON_BUMIPUTERA").length,
};

const facingCounts = countBy(parsed.units, (u) => u.facing ?? "NULL");

const refUnitNoSet = new Set(ref.units.map((u) => u.unitNo));
const missingFromRef = parsed.units.filter((u) => !refUnitNoSet.has(u.unitNo)).map((u) => u.unitNo);

const report = {
  schemaParse: true,
  totals: {
    totalUnits: { actual: parsed.units.length, target: vt.totalUnits, ok: parsed.units.length === vt.totalUnits },
    uniqueUnitNos: { actual: unitNoSet.size, target: vt.uniqueUnitNos, ok: unitNoSet.size === vt.uniqueUnitNos },
    ptdPrefixedUnitNos: { actual: ptdPrefixed, target: vt.totalUnits, ok: ptdPrefixed === vt.totalUnits },
    hsdPrefixedUnitNos: { actual: hsdPrefixed, target: 0, ok: hsdPrefixed === 0 },
  },
  layouts: {
    layoutCount: { actual: parsed.layouts.length, target: vt.layoutCount, ok: parsed.layouts.length === vt.layoutCount },
    layoutCounts,
  },
  lotAllocationCounts: {
    actual: lotCounts,
    target: vt.lotAllocationCounts,
    ok:
      lotCounts.BUMIPUTERA === vt.lotAllocationCounts.BUMIPUTERA &&
      lotCounts.NON_BUMIPUTERA === vt.lotAllocationCounts.NON_BUMIPUTERA,
  },
  pricingTotals: {
    spaPriceGdvTotal: {
      actual: sumBy(parsed.units, (u) => u.basePrice),
      target: vt.spaPriceGdvTotal,
      ok: sumBy(parsed.units, (u) => u.basePrice) === vt.spaPriceGdvTotal,
    },
    netSellingPriceTotal: {
      actual: sumBy(parsed.units, (u) => u.finalPrice),
      target: vt.netSellingPriceTotal,
      ok: sumBy(parsed.units, (u) => u.finalPrice) === vt.netSellingPriceTotal,
    },
    rebateAmountTotal: {
      actual: sumBy(ref.units, (u) => u.pricing.rebateAmount),
      target: vt.rebateAmountTotal,
      ok: sumBy(ref.units, (u) => u.pricing.rebateAmount) === vt.rebateAmountTotal,
    },
    facingUnblockedAmountTotal: {
      actual: sumBy(ref.units, (u) => u.pricing.facingUnblockedAmount),
      target: vt.facingUnblockedAmountTotal,
      ok: sumBy(ref.units, (u) => u.pricing.facingUnblockedAmount) === vt.facingUnblockedAmountTotal,
    },
  },
  facingCounts: {
    actual: facingCounts,
    target: vt.facingCounts,
  },
  bookingStatusOmitted: {
    actual: bookingFieldCount,
    target: 0,
    ok: bookingFieldCount === 0,
  },
  unitNoMembership: {
    missingFromReferenceCount: missingFromRef.length,
    sample: missingFromRef.slice(0, 5),
    ok: missingFromRef.length === 0,
  },
  unsupportedFields: [
    "Per-unit separate HSD identifier field is not present in project-import schema; HSD cannot be preserved in a dedicated import field while keeping streetName null.",
    "Developer registration numbers and legacy registration number have no dedicated project-import fields.",
    "feesAndPackages has no dedicated typed fields in project-import schema; captured as project tags.",
    "Foreigner purchase eligibility has no dedicated typed project-import field; captured as project tags.",
    "Layout-type Intermediate/End/Corner lookups are not pre-seeded in repository defaults; import payload maps semantic values directly and importer will create lookup rows if absent.",
  ],
};

const preview = await previewProjectImport(parsed);

console.log(JSON.stringify({ report, preview }, null, 2));
