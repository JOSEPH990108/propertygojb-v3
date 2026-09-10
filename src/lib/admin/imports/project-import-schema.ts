import { z } from "zod";

const lookupRefSchema = z.union([
  z.string().trim().min(1),
  z.object({
    code: z.string().trim().min(1),
    name: z.string().trim().min(1),
  }),
]);

const optionalLookupRefSchema = lookupRefSchema.optional().nullable();

const projectImportLocationSchema = z
  .object({
    country: z.string().trim().min(1).default("Malaysia"),
    state: z.string().trim().min(1),
    region: z.string().trim().min(1),
    area: z.string().trim().min(1),
    address: z.string().trim().optional().nullable(),
  })
  .optional()
  .nullable();

const projectImportLayoutSchema = z.object({
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().optional().nullable(),
  layoutType: optionalLookupRefSchema,
  builtUpSqft: z.coerce.number().positive(),
  bedrooms: z.coerce.number().int().min(0).default(0),
  bathrooms: z.coerce.number().int().min(0).default(0),
  studyRooms: z.coerce.number().int().min(0).default(0),
  hasBalcony: z.boolean().default(false),
  hasYard: z.boolean().default(false),
  isDualKey: z.boolean().default(false),
  ceilingHeightM: z.coerce.number().positive().optional().nullable(),
  furnishingStatus: z.string().trim().default("UNFURNISHED"),
});

const projectImportUnitSchema = z.object({
  unitNo: z.string().trim().min(1).max(50),
  layoutCode: z.string().trim().optional().nullable(),
  lotType: lookupRefSchema,
  bookingStatus: optionalLookupRefSchema,
  floor: z.coerce.number().int().optional().nullable(),
  stack: z.string().trim().optional().nullable(),
  streetName: z.string().trim().optional().nullable(),
  blockCode: z.string().trim().max(50).optional().nullable(),
  displaySequence: z.coerce.number().int().min(0).default(0),
  builtUpSqft: z.coerce.number().min(0).optional().nullable(),
  landAreaSqft: z.coerce.number().min(0).optional().nullable(),
  dimensionText: z.string().trim().optional().nullable(),
  facing: z.string().trim().optional().nullable(),
  facingType: optionalLookupRefSchema,
  positionType: optionalLookupRefSchema,
  viewType: optionalLookupRefSchema,
  carparkCount: z.coerce.number().int().min(0).default(1),
  carparkLotNo: z.string().trim().optional().nullable(),
  carparkType: z.string().trim().optional().nullable(),
  basePrice: z.coerce.number().min(0).default(0),
  finalPrice: z.coerce.number().min(0).optional().nullable(),
});

const nearbyPlaceSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(50).default("OTHER"),
  distanceKm: z.coerce.number().min(0).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

const landedSitePlanSchema = z.object({
  zoneCode: z.string().trim().min(1).max(50),
  title: z.string().trim().min(1).max(120),
  tabs: z
    .array(
      z.object({
        code: z.string().trim().min(1).max(50),
        label: z.string().trim().min(1).max(120),
        layoutCodes: z.array(z.string().trim().min(1).max(50)).min(1),
      }),
    )
    .min(1),
  maps: z
    .array(
      z.object({
        tabCode: z.string().trim().min(1).max(50),
        markerRadius: z.coerce.number().positive().max(100).default(12),
        hitRadius: z.coerce.number().positive().max(100).default(22),
        lots: z
          .array(
            z.object({
              unitNo: z.string().trim().min(1).max(50),
              xNorm: z.coerce.number().min(0).max(1),
              yNorm: z.coerce.number().min(0).max(1),
            }),
          )
          .min(1),
      }),
    )
    .optional(),
  rowGroups: z
    .array(
      z.object({
        code: z.string().trim().min(1).max(50),
        label: z.string().trim().min(1).max(120),
        rows: z.array(z.array(z.string().trim().min(1).max(50)).min(1).max(30)).min(1),
      }),
    )
    .optional(),
});

const availabilityPlanSchema = z.object({
  towerCode: z.string().trim().min(1).max(50),
  plan: z.object({
    physicalStacks: z.array(z.string().trim().min(1)).optional(),
    viewGroups: z.array(z.array(z.string().trim().min(1)).min(1)).optional(),
    floorOverrides: z
      .record(
        z.string().trim().min(1),
        z.object({
          mergedFootprints: z
            .array(z.array(z.string().trim().min(1)).min(1))
            .optional(),
          serviceBlocks: z
            .array(
              z.object({
                label: z.string().trim().min(1),
                stacks: z.array(z.string().trim().min(1)).min(1),
              }),
            )
            .optional(),
          unitStackToPhysicalStack: z
            .record(z.string().trim().min(1), z.string().trim().min(1))
            .optional(),
        }),
      )
      .optional(),
    sitePlan: landedSitePlanSchema.optional(),
  }),
});

export const projectImportSchema = z.object({
  version: z.literal(1),
  type: z.literal("project-import"),
  mode: z.enum(["upsert"]).default("upsert"),
  project: z.object({
    name: z.string().trim().min(1),
    legalName: z.string().trim().optional().nullable(),
    slug: z.string().trim().optional().nullable(),
    developerName: z.string().trim().min(1),
    propertyCategory: lookupRefSchema,
    propertyType: lookupRefSchema,
    tenureType: lookupRefSchema,
    projectStatus: optionalLookupRefSchema,
    totalUnits: z.coerce.number().int().min(0).default(0),
    launchYear: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
    completionText: z.string().trim().optional().nullable(),
    isHotDeal: z.boolean().default(false),
    isPublished: z.boolean().default(false),
    location: projectImportLocationSchema,
  }),
  layouts: z.array(projectImportLayoutSchema).default([]),
  units: z.array(projectImportUnitSchema).default([]),
  amenities: z.array(z.string().trim().min(1)).default([]),
  tags: z.array(z.string().trim().min(1)).default([]),
  nearbyPlaces: z.array(nearbyPlaceSchema).default([]),
  availabilityPlans: z.array(availabilityPlanSchema).default([]),
});

export type LookupRef = z.infer<typeof lookupRefSchema>;
export type ProjectImportPayload = z.infer<typeof projectImportSchema>;

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function normalizeCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");
}

export function normalizeLookupRef(value: LookupRef) {
  if (typeof value === "string") {
    return {
      code: normalizeCode(value),
      name: value
        .trim()
        .replace(/_/g, " ")
        .replace(/\s+/g, " "),
    };
  }

  return {
    code: normalizeCode(value.code),
    name: value.name.trim(),
  };
}

export function parseProjectImportPayload(payload: unknown) {
  return projectImportSchema.parse(payload);
}
