import { NextRequest } from "next/server";

import { requireRole } from "@/lib/auth/guards";
import { formatMoney } from "@/lib/bookings/format";
import { getPropertyInventory } from "@/lib/properties/inventory";

type PropertyPortal = "admin" | "agent";

function parsePortal(value: string | null): PropertyPortal {
  return value === "agent" ? "agent" : "admin";
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function csvRow(values: unknown[]) {
  return values.map(csvCell).join(",");
}

function formatSqft(value: string | number | null) {
  if (!value) {
    return "";
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return String(value);
  }

  return `${amount.toLocaleString("en-MY")} sqft`;
}

function getProjectName(unit: {
  projectDisplayName: string | null;
  projectName: string;
}) {
  return unit.projectDisplayName ?? unit.projectName;
}

function getFileName(portal: PropertyPortal) {
  const date = new Date().toISOString().slice(0, 10);
  return `${portal}-property-inventory-${date}.csv`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const portal = parsePortal(searchParams.get("portal"));

  if (portal === "admin") {
    await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/properties");
  } else {
    await requireRole(["AGENT", "SUPER_ADMIN"], "/agent/properties");
  }

  const filters = {
    search: searchParams.get("q") ?? "",
    projectId: searchParams.get("project") ?? "",
    bookingStatusId: searchParams.get("status") ?? "",
    lotTypeId: searchParams.get("lotType") ?? "",
  };

  const inventory = await getPropertyInventory(filters);

  const rows: string[] = [];

  rows.push(csvRow(["PropertyGoJB Property Inventory Export"]));
  rows.push(csvRow(["Portal", portal]));
  rows.push(csvRow(["Search", filters.search]));
  rows.push(csvRow(["Project ID", filters.projectId]));
  rows.push(csvRow(["Booking Status ID", filters.bookingStatusId]));
  rows.push(csvRow(["Lot Type ID", filters.lotTypeId]));
  rows.push(csvRow(["Generated At", new Date().toISOString()]));
  rows.push("");

  rows.push(csvRow(["Summary"]));
  rows.push(csvRow(["Metric", "Value"]));
  rows.push(csvRow(["Projects", inventory.metrics.totalProjects]));
  rows.push(csvRow(["Units", inventory.metrics.totalUnits]));
  rows.push(csvRow(["Available", inventory.metrics.availableUnits]));
  rows.push(csvRow(["Reserved / Booked", inventory.metrics.reservedUnits]));
  rows.push(csvRow(["Sold", inventory.metrics.soldUnits]));
  rows.push("");

  rows.push(csvRow(["Unit Inventory"]));
  rows.push(
    csvRow([
      "Project",
      "Project Slug",
      "Published",
      "Unit No",
      "Floor",
      "Stack",
      "Street",
      "Layout Code",
      "Layout Name",
      "Bedrooms",
      "Bathrooms",
      "Lot Type",
      "Built Up",
      "Land Area",
      "Dimension",
      "Facing",
      "Carpark",
      "Base Price",
      "Final Price",
      "Booking Status",
      "Status Code",
    ]),
  );

  for (const unit of inventory.units) {
    rows.push(
      csvRow([
        getProjectName(unit),
        unit.projectSlug,
        unit.isPublished ? "Published" : "Draft",
        unit.unitNo,
        unit.floor ?? "",
        unit.stack ?? "",
        unit.streetName ?? "",
        unit.layoutCode ?? "",
        unit.layoutName ?? "",
        unit.bedrooms ?? "",
        unit.bathrooms ?? "",
        unit.lotTypeName,
        formatSqft(unit.builtUpSqft),
        formatSqft(unit.landAreaSqft),
        unit.dimensionText ?? "",
        unit.facing ?? "",
        unit.carparkCount,
        formatMoney(unit.basePrice, "MYR"),
        formatMoney(unit.finalPrice ?? unit.basePrice, "MYR"),
        unit.bookingStatusName,
        unit.bookingStatusCode,
      ]),
    );
  }

  const csv = rows.join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${getFileName(portal)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
