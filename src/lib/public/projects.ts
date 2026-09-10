import "server-only";

import { cache } from "react";
import { and, asc, desc, eq, inArray, isNull, lte, or } from "drizzle-orm";

import { db, schema } from "@/db";

export {
  buildPublicProjectFilterOptions,
  filterPublicProjects,
} from "@/lib/public/project-filters";
export type {
  PublicProjectFilterOption,
  PublicProjectFilters,
} from "@/lib/public/project-filters";

export type PublicProjectCard = {
  id: string;
  slug: string;
  name: string;
  displayName: string | null;
  legalName: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  totalUnits: number;
  launchYear: number | null;
  isHotDeal: boolean;
  developerName: string | null;
  propertyCategoryId: string | null;
  propertyCategoryName: string | null;
  propertyTypeId: string | null;
  propertyTypeName: string | null;
  projectStatusId: string | null;
  projectStatusName: string | null;
  tenureTypeId: string;
  tenureName: string | null;
  titleTypeName: string | null;
  regionId: string | null;
  regionName: string | null;
  areaId: string | null;
  areaName: string | null;
  mediaUrl: string | null;
  mediaCaption: string | null;
  minPrice: string | null;
  availableUnitCount: number;
  layoutCount: number;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  heroVideoUrl: string | null;
  highlights: string[];
  faqs: { question: string; answer: string }[];
};

export type PublicProjectDetail = {
  project: PublicProjectCard;
  availabilityPlans: {
    towerCode: string;
    plan: unknown;
  }[];
  mediaItems: {
    id: string;
    url: string | null;
    key: string | null;
    caption: string | null;
  }[];
  layouts: {
    id: string;
    code: string;
    name: string | null;
    builtUpSqft: string;
    bedrooms: number;
    bathrooms: number;
    studyRooms: number;
    layoutTypeName: string | null;
    floorPlanUrl: string | null;
    hasBalcony: boolean;
    hasYard: boolean;
    isDualKey: boolean;
    furnishingStatus: string;
    virtualTourUrl: string | null;
  }[];
  units: {
    id: string;
    unitNo: string;
    layoutId: string | null;
    floor: number | null;
    stack: string | null;
    blockCode: string | null;
    basePrice: string;
    finalPrice: string | null;
    builtUpSqft: string | null;
    landAreaSqft: string | null;
    dimensionText: string | null;
    facing: string | null;
    facingTypeName: string | null;
    bookingStatusCode: string | null;
    bookingStatusName: string | null;
    lotTypeName: string | null;
    positionTypeName: string | null;
    viewTypeName: string | null;
  }[];
  amenities: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  nearbyPlaces: {
    id: string;
    name: string;
    category: string;
    distanceKm: string | null;
  }[];
};

function formatMoney(value: number | null) {
  if (!value || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return `RM ${value.toLocaleString("en-MY", { maximumFractionDigits: 0 })}`;
}

export const getPublicProjectCatalog = cache(async (): Promise<PublicProjectCard[]> => {
  const projects = await db
    .select({
      id: schema.projects.id,
      slug: schema.projects.slug,
      name: schema.projects.name,
      displayName: schema.projects.displayName,
      legalName: schema.projects.legalName,
      address: schema.projects.address,
      latitude: schema.projects.latitude,
      longitude: schema.projects.longitude,
      totalUnits: schema.projects.totalUnits,
      launchYear: schema.projects.launchYear,
      isHotDeal: schema.projects.isHotDeal,
      developerName: schema.developers.legalName,
      propertyCategoryId: schema.projects.propertyCategoryId,
      propertyCategoryName: schema.propertyCategories.name,
      propertyTypeId: schema.projects.propertyTypeId,
      propertyTypeName: schema.propertyTypes.name,
      projectStatusId: schema.projects.projectStatusId,
      projectStatusName: schema.projectStatuses.name,
      tenureTypeId: schema.projects.tenureTypeId,
      tenureName: schema.tenureTypes.name,
      titleTypeName: schema.titleTypes.name,
      regionId: schema.projects.regionId,
      regionName: schema.regions.name,
      areaId: schema.projects.areaId,
      areaName: schema.areas.name,
      metaTitle: schema.projects.metaTitle,
      metaDescription: schema.projects.metaDescription,
      canonicalUrl: schema.projects.canonicalUrl,
      ogTitle: schema.projects.ogTitle,
      ogDescription: schema.projects.ogDescription,
      ogImageFileId: schema.projects.ogImageFileId,
      heroVideoUrl: schema.projects.heroVideoUrl,
      highlightsJson: schema.projects.highlightsJson,
      faqJson: schema.projects.faqJson,
    })
    .from(schema.projects)
    .innerJoin(schema.developers, eq(schema.projects.developerId, schema.developers.id))
    .leftJoin(schema.propertyCategories, eq(schema.projects.propertyCategoryId, schema.propertyCategories.id))
    .leftJoin(schema.propertyTypes, eq(schema.projects.propertyTypeId, schema.propertyTypes.id))
    .leftJoin(schema.projectStatuses, eq(schema.projects.projectStatusId, schema.projectStatuses.id))
    .leftJoin(schema.tenureTypes, eq(schema.projects.tenureTypeId, schema.tenureTypes.id))
    .leftJoin(schema.titleTypes, eq(schema.projects.titleTypeId, schema.titleTypes.id))
    .leftJoin(schema.regions, eq(schema.projects.regionId, schema.regions.id))
    .leftJoin(schema.areas, eq(schema.projects.areaId, schema.areas.id))
    .where(
      and(
        eq(schema.projects.isPublished, true),
        or(isNull(schema.projects.publishedAt), lte(schema.projects.publishedAt, new Date())),
        isNull(schema.projects.deletedAt),
      ),
    )
    .orderBy(desc(schema.projects.isHotDeal), asc(schema.projects.displayName), asc(schema.projects.name));

  const projectIds = projects.map((project) => project.id);

  const [mediaItems, layoutItems, unitItems] =
    projectIds.length > 0
      ? await Promise.all([
          db
            .select({
              projectId: schema.projectMedia.projectId,
              fileId: schema.projectMedia.fileId,
              url: schema.files.url,
              key: schema.files.key,
              caption: schema.projectMedia.caption,
            })
            .from(schema.projectMedia)
            .innerJoin(schema.files, eq(schema.projectMedia.fileId, schema.files.id))
            .where(inArray(schema.projectMedia.projectId, projectIds))
            .orderBy(asc(schema.projectMedia.sortOrder), asc(schema.projectMedia.createdAt)),
          db
            .select({
              projectId: schema.projectLayouts.projectId,
              layoutId: schema.projectLayouts.id,
            })
            .from(schema.projectLayouts)
            .where(inArray(schema.projectLayouts.projectId, projectIds)),
          db
            .select({
              projectId: schema.units.projectId,
              basePrice: schema.units.basePrice,
              finalPrice: schema.units.finalPrice,
              bookingStatusCode: schema.bookingStatuses.code,
            })
            .from(schema.units)
            .leftJoin(schema.bookingStatuses, eq(schema.units.bookingStatusId, schema.bookingStatuses.id))
            .where(inArray(schema.units.projectId, projectIds)),
        ])
      : [[], [], []];

  const firstMediaByProject = new Map<string, (typeof mediaItems)[number]>();
  const layoutCountByProject = new Map<string, number>();
  const availableUnitsByProject = new Map<string, number>();
  const minPriceByProject = new Map<string, number>();

  for (const media of mediaItems) {
    if (!firstMediaByProject.has(media.projectId)) {
      firstMediaByProject.set(media.projectId, media);
    }
  }

  for (const layout of layoutItems) {
    layoutCountByProject.set(layout.projectId, (layoutCountByProject.get(layout.projectId) ?? 0) + 1);
  }

  for (const unit of unitItems) {
    const price = Number(unit.finalPrice ?? unit.basePrice);

    if (Number.isFinite(price) && price > 0) {
      const existing = minPriceByProject.get(unit.projectId);

      if (existing === undefined || price < existing) {
        minPriceByProject.set(unit.projectId, price);
      }
    }

    if (unit.bookingStatusCode === "AVAILABLE") {
      availableUnitsByProject.set(unit.projectId, (availableUnitsByProject.get(unit.projectId) ?? 0) + 1);
    }
  }

  return projects.map((project) => {
    const firstMedia = firstMediaByProject.get(project.id);

    return {
      ...project,
      displayName: project.displayName ?? project.name,
      mediaUrl: firstMedia?.url ?? firstMedia?.key ?? null,
      ogImageUrl:
        mediaItems.find(
          (media) =>
            media.projectId === project.id &&
            media.fileId === project.ogImageFileId,
        )?.url ??
        mediaItems.find(
          (media) =>
            media.projectId === project.id &&
            media.fileId === project.ogImageFileId,
        )?.key ??
        firstMedia?.url ??
        firstMedia?.key ??
        null,
      mediaCaption: firstMedia?.caption ?? null,
      minPrice: formatMoney(minPriceByProject.get(project.id) ?? null),
      availableUnitCount: availableUnitsByProject.get(project.id) ?? 0,
      layoutCount: layoutCountByProject.get(project.id) ?? 0,
      highlights: Array.isArray(project.highlightsJson)
        ? project.highlightsJson.filter((item): item is string => typeof item === "string")
        : [],
      faqs: Array.isArray(project.faqJson)
        ? project.faqJson.filter(
            (item): item is { question: string; answer: string } =>
              Boolean(
                item &&
                  typeof item === "object" &&
                  "question" in item &&
                  typeof item.question === "string" &&
                  "answer" in item &&
                  typeof item.answer === "string",
              ),
          )
        : [],
    };
  });
});

export const getPublicProjectBySlug = cache(async (slug: string): Promise<PublicProjectDetail | null> => {
  const project = await db
    .select({
      id: schema.projects.id,
      slug: schema.projects.slug,
      name: schema.projects.name,
      displayName: schema.projects.displayName,
      legalName: schema.projects.legalName,
      address: schema.projects.address,
      latitude: schema.projects.latitude,
      longitude: schema.projects.longitude,
      totalUnits: schema.projects.totalUnits,
      launchYear: schema.projects.launchYear,
      isHotDeal: schema.projects.isHotDeal,
      developerName: schema.developers.legalName,
      propertyCategoryId: schema.projects.propertyCategoryId,
      propertyCategoryName: schema.propertyCategories.name,
      propertyTypeId: schema.projects.propertyTypeId,
      propertyTypeName: schema.propertyTypes.name,
      projectStatusId: schema.projects.projectStatusId,
      projectStatusName: schema.projectStatuses.name,
      tenureTypeId: schema.projects.tenureTypeId,
      tenureName: schema.tenureTypes.name,
      titleTypeName: schema.titleTypes.name,
      regionId: schema.projects.regionId,
      regionName: schema.regions.name,
      areaId: schema.projects.areaId,
      areaName: schema.areas.name,
      metaTitle: schema.projects.metaTitle,
      metaDescription: schema.projects.metaDescription,
      canonicalUrl: schema.projects.canonicalUrl,
      ogTitle: schema.projects.ogTitle,
      ogDescription: schema.projects.ogDescription,
      ogImageFileId: schema.projects.ogImageFileId,
      heroVideoUrl: schema.projects.heroVideoUrl,
      highlightsJson: schema.projects.highlightsJson,
      faqJson: schema.projects.faqJson,
    })
    .from(schema.projects)
    .innerJoin(schema.developers, eq(schema.projects.developerId, schema.developers.id))
    .leftJoin(schema.propertyCategories, eq(schema.projects.propertyCategoryId, schema.propertyCategories.id))
    .leftJoin(schema.propertyTypes, eq(schema.projects.propertyTypeId, schema.propertyTypes.id))
    .leftJoin(schema.projectStatuses, eq(schema.projects.projectStatusId, schema.projectStatuses.id))
    .leftJoin(schema.tenureTypes, eq(schema.projects.tenureTypeId, schema.tenureTypes.id))
    .leftJoin(schema.titleTypes, eq(schema.projects.titleTypeId, schema.titleTypes.id))
    .leftJoin(schema.regions, eq(schema.projects.regionId, schema.regions.id))
    .leftJoin(schema.areas, eq(schema.projects.areaId, schema.areas.id))
    .where(
      and(
        eq(schema.projects.slug, slug),
        eq(schema.projects.isPublished, true),
        or(isNull(schema.projects.publishedAt), lte(schema.projects.publishedAt, new Date())),
        isNull(schema.projects.deletedAt),
      ),
    )
    .limit(1);

  const projectData = project[0];

  if (!projectData) {
    return null;
  }

  const [mediaItems, layouts, units, amenities, tags, nearbyPlaces, availabilityPlans] = await Promise.all([
    db
      .select({
        id: schema.projectMedia.id,
        fileId: schema.projectMedia.fileId,
        url: schema.files.url,
        key: schema.files.key,
        caption: schema.projectMedia.caption,
      })
      .from(schema.projectMedia)
      .innerJoin(schema.files, eq(schema.projectMedia.fileId, schema.files.id))
      .where(eq(schema.projectMedia.projectId, projectData.id))
      .orderBy(asc(schema.projectMedia.sortOrder), asc(schema.projectMedia.createdAt)),
    db
      .select({
        id: schema.projectLayouts.id,
        code: schema.projectLayouts.code,
        name: schema.projectLayouts.name,
        builtUpSqft: schema.projectLayouts.builtUpSqft,
        bedrooms: schema.projectLayouts.bedrooms,
        bathrooms: schema.projectLayouts.bathrooms,
        studyRooms: schema.projectLayouts.studyRooms,
        layoutTypeName: schema.layoutTypes.name,
        floorPlanUrl: schema.files.url,
        hasBalcony: schema.projectLayouts.hasBalcony,
        hasYard: schema.projectLayouts.hasYard,
        isDualKey: schema.projectLayouts.isDualKey,
        furnishingStatus: schema.projectLayouts.furnishingStatus,
        virtualTourUrl: schema.projectLayouts.virtualTourUrl,
      })
      .from(schema.projectLayouts)
      .leftJoin(schema.layoutTypes, eq(schema.projectLayouts.layoutTypeId, schema.layoutTypes.id))
      .leftJoin(schema.files, eq(schema.projectLayouts.floorPlanFileId, schema.files.id))
      .where(eq(schema.projectLayouts.projectId, projectData.id))
      .orderBy(asc(schema.projectLayouts.code)),
    db
      .select({
        id: schema.units.id,
        unitNo: schema.units.unitNo,
        layoutId: schema.units.layoutId,
        floor: schema.units.floor,
        stack: schema.units.stack,
        blockCode: schema.units.blockCode,
        basePrice: schema.units.basePrice,
        finalPrice: schema.units.finalPrice,
        builtUpSqft: schema.units.builtUpSqft,
        landAreaSqft: schema.units.landAreaSqft,
        dimensionText: schema.units.dimensionText,
        facing: schema.unitFacings.name,
        facingTypeName: schema.unitFacings.name,
        bookingStatusCode: schema.bookingStatuses.code,
        bookingStatusName: schema.bookingStatuses.name,
        lotTypeName: schema.lotTypes.name,
        positionTypeName: schema.unitPositions.name,
        viewTypeName: schema.unitViews.name,
      })
      .from(schema.units)
      .leftJoin(schema.bookingStatuses, eq(schema.units.bookingStatusId, schema.bookingStatuses.id))
      .leftJoin(schema.lotTypes, eq(schema.units.lotTypeId, schema.lotTypes.id))
      .leftJoin(schema.unitPositions, eq(schema.units.positionTypeId, schema.unitPositions.id))
      .leftJoin(schema.unitFacings, eq(schema.units.facingTypeId, schema.unitFacings.id))
      .leftJoin(schema.unitViews, eq(schema.units.viewTypeId, schema.unitViews.id))
      .where(eq(schema.units.projectId, projectData.id))
      .orderBy(asc(schema.units.displaySequence), asc(schema.units.unitNo)),
    db
      .select({
        id: schema.amenities.id,
        name: schema.amenities.name,
      })
      .from(schema.projectAmenities)
      .innerJoin(schema.amenities, eq(schema.projectAmenities.amenityId, schema.amenities.id))
      .where(eq(schema.projectAmenities.projectId, projectData.id))
      .orderBy(asc(schema.amenities.name)),
    db
      .select({
        id: schema.tags.id,
        name: schema.tags.name,
      })
      .from(schema.projectTags)
      .innerJoin(schema.tags, eq(schema.projectTags.tagId, schema.tags.id))
      .where(eq(schema.projectTags.projectId, projectData.id))
      .orderBy(asc(schema.tags.name)),
    db
      .select({
        id: schema.projectNearbyPlaces.id,
        name: schema.projectNearbyPlaces.name,
        category: schema.projectNearbyPlaces.category,
        distanceKm: schema.projectNearbyPlaces.distanceKm,
      })
      .from(schema.projectNearbyPlaces)
      .where(eq(schema.projectNearbyPlaces.projectId, projectData.id))
      .orderBy(asc(schema.projectNearbyPlaces.sortOrder), asc(schema.projectNearbyPlaces.name)),
    db
      .select({
        towerCode: schema.projectAvailabilityPlans.towerCode,
        plan: schema.projectAvailabilityPlans.plan,
      })
      .from(schema.projectAvailabilityPlans)
      .where(eq(schema.projectAvailabilityPlans.projectId, projectData.id))
      .orderBy(asc(schema.projectAvailabilityPlans.towerCode)),
  ]);

  const minPrice = units
    .map((unit) => Number(unit.finalPrice ?? unit.basePrice))
    .filter((price) => Number.isFinite(price) && price > 0);

  const heroMedia = mediaItems[0];
  const ogMedia = mediaItems.find((media) => media.fileId === projectData.ogImageFileId);

  return {
    project: {
      ...projectData,
      displayName: projectData.displayName ?? projectData.name,
      mediaUrl: heroMedia?.url ?? heroMedia?.key ?? null,
      ogImageUrl:
        ogMedia?.url ??
        ogMedia?.key ??
        heroMedia?.url ??
        heroMedia?.key ??
        null,
      mediaCaption: heroMedia?.caption ?? null,
      minPrice: formatMoney(minPrice.length > 0 ? Math.min(...minPrice) : null),
      availableUnitCount: units.filter((unit) => unit.bookingStatusCode === "AVAILABLE").length,
      layoutCount: layouts.length,
      highlights: Array.isArray(projectData.highlightsJson)
        ? projectData.highlightsJson.filter((item): item is string => typeof item === "string")
        : [],
      faqs: Array.isArray(projectData.faqJson)
        ? projectData.faqJson.filter(
            (item): item is { question: string; answer: string } =>
              Boolean(
                item &&
                  typeof item === "object" &&
                  "question" in item &&
                  typeof item.question === "string" &&
                  "answer" in item &&
                  typeof item.answer === "string",
              ),
          )
        : [],
    },
    mediaItems,
    availabilityPlans,
    layouts,
    units,
    amenities,
    tags,
    nearbyPlaces,
  };
});

export function getPublicProjectPageTitle(projectName: string) {
  return `${projectName} | PropertyGoJB`;
}
