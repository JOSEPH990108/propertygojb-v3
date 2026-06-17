import { schema } from "@/db";

export const simpleLookupConfigs = {
  "project-statuses": {
    title: "Project Statuses",
    description: "Manage project launch, selling, completed, and related statuses.",
    table: schema.projectStatuses,
    backHref: "/admin/settings/lookups",
  },
  "property-categories": {
    title: "Property Categories",
    description: "Manage high-level property groups such as landed or high rise.",
    table: schema.propertyCategories,
    backHref: "/admin/settings/lookups",
  },
  "tenure-types": {
    title: "Tenure Types",
    description: "Manage property tenure values such as Freehold or Leasehold.",
    table: schema.tenureTypes,
    backHref: "/admin/settings/lookups",
  },
  "title-types": {
    title: "Title Types",
    description: "Manage title values such as Individual Title or Strata Title.",
    table: schema.titleTypes,
    backHref: "/admin/settings/lookups",
  },
  "construction-statuses": {
    title: "Construction Statuses",
    description: "Manage construction progress statuses.",
    table: schema.constructionStatuses,
    backHref: "/admin/settings/lookups",
  },
  "booking-statuses": {
    title: "Booking Statuses",
    description: "Manage booking workflow statuses.",
    table: schema.bookingStatuses,
    backHref: "/admin/settings/lookups",
  },
  "appointment-statuses": {
    title: "Appointment Statuses",
    description: "Manage appointment workflow statuses.",
    table: schema.appointmentStatuses,
    backHref: "/admin/settings/lookups",
  },
  "buyer-types": {
    title: "Buyer Types",
    description: "Manage buyer classification values.",
    table: schema.buyerTypes,
    backHref: "/admin/settings/lookups",
  },
  "media-types": {
    title: "Media Types",
    description: "Manage project media type values.",
    table: schema.mediaTypes,
    backHref: "/admin/settings/lookups",
  },
  "layout-types": {
    title: "Layout Types",
    description: "Manage project layout type values.",
    table: schema.layoutTypes,
    backHref: "/admin/settings/lookups",
  },
} as const;

export type SimpleLookupKey = keyof typeof simpleLookupConfigs;

export function getSimpleLookupConfig(lookupKey: string) {
  if (lookupKey in simpleLookupConfigs) {
    return simpleLookupConfigs[lookupKey as SimpleLookupKey];
  }

  return null;
}

export function getSimpleLookupConfigList() {
  return Object.entries(simpleLookupConfigs).map(([key, config]) => ({
    key,
    title: config.title,
    description: config.description,
  }));
}
