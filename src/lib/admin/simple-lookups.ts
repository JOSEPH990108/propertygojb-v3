import { schema } from "@/db";

export const simpleLookupConfigs = {
  "project-statuses": {
    kind: "code",
    title: "Project Statuses",
    description: "Manage project launch, selling, completed, and related statuses.",
    table: schema.projectStatuses,
    backHref: "/admin/settings/lookups",
  },
  "property-categories": {
    kind: "code",
    title: "Property Categories",
    description: "Manage high-level property groups such as landed or high rise.",
    table: schema.propertyCategories,
    backHref: "/admin/settings/lookups",
  },
  "tenure-types": {
    kind: "code",
    title: "Tenure Types",
    description: "Manage property tenure values such as Freehold or Leasehold.",
    table: schema.tenureTypes,
    backHref: "/admin/settings/lookups",
  },
  "title-types": {
    kind: "code",
    title: "Title Types",
    description: "Manage title values such as Individual Title or Strata Title.",
    table: schema.titleTypes,
    backHref: "/admin/settings/lookups",
  },
  "lot-types": {
    kind: "code",
    title: "Allocation Types",
    description: "Manage allocation values such as Bumi, Non Bumi, or International.",
    table: schema.lotTypes,
    backHref: "/admin/settings/lookups",
  },
  "unit-positions": {
    kind: "code",
    title: "Unit Positions",
    description: "Manage unit positions such as Intermediate Lot, End Lot, Corner Lot, High Floor, or Pool View.",
    table: schema.unitPositions,
    backHref: "/admin/settings/lookups",
  },
  "construction-statuses": {
    kind: "code",
    title: "Construction Statuses",
    description: "Manage construction progress statuses.",
    table: schema.constructionStatuses,
    backHref: "/admin/settings/lookups",
  },
  "booking-statuses": {
    kind: "code",
    title: "Booking Statuses",
    description: "Manage booking workflow statuses.",
    table: schema.bookingStatuses,
    backHref: "/admin/settings/lookups",
  },
  "appointment-statuses": {
    kind: "code",
    title: "Appointment Statuses",
    description: "Manage appointment workflow statuses.",
    table: schema.appointmentStatuses,
    backHref: "/admin/settings/lookups",
  },
  "buyer-types": {
    kind: "code",
    title: "Buyer Types",
    description: "Manage buyer classification values.",
    table: schema.buyerTypes,
    backHref: "/admin/settings/lookups",
  },
  "media-types": {
    kind: "code",
    title: "Media Types",
    description: "Manage project media type values.",
    table: schema.mediaTypes,
    backHref: "/admin/settings/lookups",
  },
  "layout-types": {
    kind: "code",
    title: "Layout Types",
    description: "Manage layout values such as Standard, Duplex, Penthouse, Loft, or Dual Key.",
    table: schema.layoutTypes,
    backHref: "/admin/settings/lookups",
  },
  amenities: {
    kind: "slug",
    title: "Amenities",
    description: "Manage shared project amenities such as Swimming Pool, Gym, Guardhouse, or BBQ Area.",
    table: schema.amenities,
    backHref: "/admin/settings/lookups",
  },
  tags: {
    kind: "slug",
    title: "Tags",
    description: "Manage marketing tags such as Free MOT, Gated Community, Rebate, or Near RTS.",
    table: schema.tags,
    backHref: "/admin/settings/lookups",
  },
} as const;

export type SimpleLookupKey = keyof typeof simpleLookupConfigs;
export type SimpleLookupKind = "code" | "slug";

export function getSimpleLookupConfig(lookupKey: string) {
  if (lookupKey in simpleLookupConfigs) {
    return simpleLookupConfigs[lookupKey as SimpleLookupKey];
  }

  return null;
}

export function getSimpleLookupConfigList() {
  return Object.entries(simpleLookupConfigs).map(([key, config]) => ({
    key,
    kind: config.kind,
    title: config.title,
    description: config.description,
  }));
}
