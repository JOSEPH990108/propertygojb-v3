// src\db\schema\catalog.ts
import {
  boolean,
  date,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { baseColumns, slugColumns } from "./base";
import { areas, regions } from "./geo";
import { files } from "./files";
import {
  constructionStatuses,
  layoutTypes,
  mediaTypes,
  projectStatuses,
  propertyCategories,
  propertyTypes,
  tags,
  tenureTypes,
  titleTypes,
  amenities,
} from "./lookups";

export const developers = pgTable(
  "developers",
  {
    ...slugColumns(),
    legalName: varchar("legal_name", { length: 200 }),
    countryCode: varchar("country_code", { length: 10 }),
    isFeatured: boolean("is_featured").default(false).notNull(),
    logoFileId: text("logo_file_id").references(() => files.id),
  },
  (t) => ({
    uniqSlug: unique().on(t.slug),
  }),
);

export const projects = pgTable(
  "projects",
  {
    ...slugColumns(),
    displayName: varchar("display_name", { length: 200 }),
    legalName: varchar("legal_name", { length: 200 }),
    developerId: text("developer_id")
      .references(() => developers.id)
      .notNull(),

    propertyCategoryId: text("property_category_id").references(
      () => propertyCategories.id,
    ),
    propertyTypeId: text("property_type_id").references(() => propertyTypes.id),
    projectStatusId: text("project_status_id").references(
      () => projectStatuses.id,
    ),

    tenureTypeId: text("tenure_type_id")
      .references(() => tenureTypes.id)
      .notNull(),
    titleTypeId: text("title_type_id").references(() => titleTypes.id),
    tenureExpiryDate: date("tenure_expiry_date"),

    regionId: text("region_id").references(() => regions.id),
    areaId: text("area_id").references(() => areas.id),
    address: text("address"),
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),

    landAreaAcres: decimal("land_area_acres", { precision: 10, scale: 4 }),

    bookingFee: decimal("booking_fee", { precision: 10, scale: 2 }).default(
      "1000.00",
    ),
    bookingFeeBumi: decimal("booking_fee_bumi", { precision: 10, scale: 2 }),
    maintenanceFeePerSqft: decimal("maintenance_fee_per_sqft", {
      precision: 10,
      scale: 2,
    }),
    sinkingFundPerSqft: decimal("sinking_fund_per_sqft", {
      precision: 10,
      scale: 2,
    }),
    isForeignerEligible: boolean("is_foreigner_eligible")
      .default(true)
      .notNull(),

    foreignerEligibility: jsonb("foreigner_eligibility"),
    isGatedCommunity: boolean("is_gated_community").default(false).notNull(),
    greenCertification: varchar("green_certification", { length: 100 }),
    totalUnits: integer("total_units").default(0).notNull(),
    launchYear: integer("launch_year"),
    featuredFileId: text("featured_file_id").references(() => files.id),
    isHotDeal: boolean("is_hot_deal").default(false).notNull(),
    isPublished: boolean("is_published").default(false).notNull(),
    publishedAt: timestamp("published_at"),

    metaTitle: varchar("meta_title", { length: 70 }),
    metaDescription: varchar("meta_description", { length: 180 }),
    canonicalUrl: varchar("canonical_url", { length: 1000 }),
    ogTitle: varchar("og_title", { length: 100 }),
    ogDescription: varchar("og_description", { length: 300 }),
    ogImageFileId: text("og_image_file_id").references(() => files.id),
    heroVideoUrl: varchar("hero_video_url", { length: 1000 }),
    highlightsJson: jsonb("highlights_json"),
    faqJson: jsonb("faq_json"),
  },
  (t) => ({
    uniqSlug: unique().on(t.slug),
    projectStatusIdx: index("projects_status_idx").on(t.projectStatusId),
    projectTypeIdx: index("projects_type_idx").on(t.propertyTypeId),
    projectRegionIdx: index("projects_region_idx").on(t.regionId),
    projectAreaIdx: index("projects_area_idx").on(t.areaId),
  }),
);

export const projectPhases = pgTable(
  "project_phases",
  {
    ...baseColumns(),
    projectId: text("project_id")
      .references(() => projects.id)
      .notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    phaseCode: varchar("phase_code", { length: 50 }),
    completionDate: date("completion_date"),
    constructionStatusId: text("construction_status_id").references(
      () => constructionStatuses.id,
    ),
  },
  (t) => ({
    uniqProjectPhaseName: unique().on(t.projectId, t.name),
    uniqProjectPhaseCode: unique().on(t.projectId, t.phaseCode),
  }),
);

export const projectTowers = pgTable(
  "project_towers",
  {
    ...baseColumns(),
    projectId: text("project_id")
      .references(() => projects.id)
      .notNull(),
    phaseId: text("phase_id").references(() => projectPhases.id),
    towerNumber: varchar("tower_number", { length: 50 }),
    name: varchar("name", { length: 100 }),
    floorCount: integer("floor_count"),
    floorMin: integer("floor_min"),
    floorMax: integer("floor_max"),
  },
  (t) => ({
    uniqProjectTowerNumber: unique().on(t.projectId, t.towerNumber),
  }),
);

export const projectAvailabilityPlans = pgTable(
  "project_availability_plans",
  {
    ...baseColumns(),
    projectId: text("project_id")
      .references(() => projects.id)
      .notNull(),
    towerCode: varchar("tower_code", { length: 50 }).notNull(),
    plan: jsonb("plan").notNull(),
  },
  (t) => ({
    uniqProjectAvailabilityPlanTower: unique().on(t.projectId, t.towerCode),
    availabilityPlansProjectIdx: index("availability_plans_project_idx").on(t.projectId),
  }),
);

export const projectLayouts = pgTable(
  "project_layouts",
  {
    ...baseColumns(),
    projectId: text("project_id")
      .references(() => projects.id)
      .notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    name: varchar("name", { length: 100 }),
    layoutTypeId: text("layout_type_id").references(() => layoutTypes.id),
    builtUpSqft: decimal("built_up_sqft", {
      precision: 10,
      scale: 2,
    }).notNull(),
    bedrooms: integer("bedrooms").notNull(),
    bathrooms: integer("bathrooms").notNull(),
    studyRooms: integer("study_rooms").default(0).notNull(),
    hasBalcony: boolean("has_balcony").default(false).notNull(),
    hasYard: boolean("has_yard").default(false).notNull(),
    isDualKey: boolean("is_dual_key").default(false).notNull(),
    ceilingHeightM: decimal("ceiling_height_m", { precision: 4, scale: 2 }),
    furnishingStatus: varchar("furnishing_status", { length: 20 })
      .default("UNFURNISHED")
      .notNull(),
    floorPlanFileId: text("floor_plan_file_id").references(() => files.id),
    virtualTourUrl: varchar("virtual_tour_url", { length: 1000 }),
  },
  (t) => ({
    uniqProjectLayoutCode: unique().on(t.projectId, t.code),
  }),
);

export const projectMedia = pgTable(
  "project_media",
  {
    ...baseColumns(),
    projectId: text("project_id")
      .references(() => projects.id)
      .notNull(),
    fileId: text("file_id")
      .references(() => files.id)
      .notNull(),
    mediaTypeId: text("media_type_id").references(() => mediaTypes.id),
    caption: varchar("caption", { length: 300 }),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (t) => ({
    projectMediaProjectIdx: index("project_media_project_idx").on(t.projectId),
  }),
);

export const projectNearbyPlaces = pgTable(
  "project_nearby_places",
  {
    ...baseColumns(),
    projectId: text("project_id")
      .references(() => projects.id)
      .notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    distanceKm: decimal("distance_km", { precision: 6, scale: 2 }),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (t) => ({
    projectNearbyPlacesProjectIdx: index(
      "project_nearby_places_project_idx",
    ).on(t.projectId),
    projectNearbyPlacesCategoryIdx: index(
      "project_nearby_places_category_idx",
    ).on(t.projectId, t.category),
  }),
);

export const projectAmenities = pgTable(
  "project_amenities",
  {
    projectId: text("project_id")
      .references(() => projects.id)
      .notNull(),
    amenityId: text("amenity_id")
      .references(() => amenities.id)
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.projectId, t.amenityId] }),
  }),
);

export const projectTags = pgTable(
  "project_tags",
  {
    projectId: text("project_id")
      .references(() => projects.id)
      .notNull(),
    tagId: text("tag_id")
      .references(() => tags.id)
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.projectId, t.tagId] }),
  }),
);
