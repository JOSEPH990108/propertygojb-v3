import { notFound } from "next/navigation";

import { PublicProjectCard } from "@/components/public/public-project-card";
import { StructuredData } from "@/components/public/structured-data";
import {
  MaskedPrice,
  PriceAuthProvider,
} from "@/components/public/price-visibility";
import {
  ProjectHero,
  type ProjectHeroMedia,
} from "@/components/public/project-template/project-hero";
import {
  ProjectDirectoryNav,
  type ProjectDirectoryItem,
} from "@/components/public/project-template/project-directory-nav";
import {
  ProjectFactsSection,
  type ProjectFact,
} from "@/components/public/project-template/project-facts-section";
import {
  ProjectLocationSection,
  type ProjectNearbyPlace,
} from "@/components/public/project-template/project-location-section";
import {
  ProjectLayoutsSection,
  type ProjectLayoutOption,
} from "@/components/public/project-template/project-layouts-section";
import {
  ProjectFacilitiesSection,
  type ProjectFacilityItem,
} from "@/components/public/project-template/project-facilities-section";
import {
  ProjectGallerySection,
  type ProjectGalleryPhoto,
} from "@/components/public/project-template/project-gallery-section";
import {
  ProjectAvailabilitySection,
  type ProjectAvailabilityRow,
} from "@/components/public/project-template/project-availability-section";
import { ProjectToolsSection } from "@/components/public/project-template/project-tools-section";
import { ProjectEnquireSection } from "@/components/public/project-template/project-enquire-section";
import { getPublicUrl, publicSiteConfig } from "@/config/public-site";
import { getCurrentAuthContext } from "@/lib/auth/guards";
import {
  FALLBACK_GALLERY_IMAGES,
  FALLBACK_HERO_IMAGE,
  FALLBACK_LAYOUT_GROUPS,
  FALLBACK_SITE_PLAN_IMAGE,
} from "@/lib/public/fallback-media";
import {
  buildLayoutAvailability,
  buildUnitPositionBreakdown,
} from "@/lib/public/project-detail-view";
import {
  getPublicProjectBySlug,
  getPublicProjectCatalog,
  getPublicProjectPageTitle,
} from "@/lib/public/projects";
import { getPublicWhatsAppHref } from "@/lib/public/site";
import { buildPublicPageMetadata } from "@/lib/public/seo";

const DIRECTORY_GROUP_ORDER = ["Discover", "The details", "Planning"];

function formatMyr(value: number | null) {
  if (!value || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return `RM ${value.toLocaleString("en-MY", { maximumFractionDigits: 0 })}`;
}

function formatSqft(value: string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0
    ? `${Math.round(parsed).toLocaleString("en-MY")} sq ft`
    : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getPublicProjectBySlug(slug);

  if (!detail) {
    return { title: "Project not found" };
  }

  const name = detail.project.displayName ?? detail.project.name;
  const description =
    detail.project.metaDescription ??
    detail.project.mediaCaption ??
    `View project details, layouts, and availability for ${name}.`;
  const canonical =
    detail.project.canonicalUrl ?? getPublicUrl(`/projects/${slug}`);

  return buildPublicPageMetadata({
    title: detail.project.metaTitle ?? getPublicProjectPageTitle(name),
    description,
    path: `/projects/${slug}`,
    canonicalUrl: canonical,
    socialTitle: detail.project.ogTitle ?? detail.project.metaTitle ?? name,
    socialDescription: detail.project.ogDescription ?? description,
    images: detail.project.ogImageUrl
      ? [{ url: detail.project.ogImageUrl }]
      : undefined,
  });
}

export async function generateStaticParams() {
  const projects = await getPublicProjectCatalog();
  return projects.map((project) => ({ slug: project.slug }));
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getPublicProjectBySlug(slug);

  if (!detail) {
    notFound();
  }

  // Server-side check so an anonymous visitor's HTML never contains the real
  // price in the first place — client-only masking would still leak it via
  // view-source before JS hides it.
  const { isAuthenticated } = await getCurrentAuthContext();

  const { project, mediaItems, layouts, units, amenities, nearbyPlaces } =
    detail;
  const catalog = await getPublicProjectCatalog();
  const relatedProjects = catalog
    .filter((item) => item.id !== project.id)
    .slice(0, 3);
  const projectName = project.displayName ?? project.name;
  const areaLabel = project.areaName ?? project.regionName ?? "Johor Bahru";
  const heroImage = mediaItems[0];
  const whatsappHref = getPublicWhatsAppHref(
    `Hi, I am interested in ${projectName}. Please share more details.`,
  );
  const projectSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: project.displayName ?? project.name,
    description: project.metaDescription ?? project.mediaCaption ?? undefined,
    image: mediaItems.map((media) => media.url ?? media.key).filter(Boolean),
    url: getPublicUrl(`/projects/${project.slug}`),
    brand: {
      "@type": "Organization",
      name: project.developerName ?? publicSiteConfig.name,
    },
    offers: project.minPrice
      ? {
          "@type": "AggregateOffer",
          priceCurrency: "MYR",
          availability: "https://schema.org/InStock",
          offerCount: project.availableUnitCount,
        }
      : undefined,
  };
  const faqSchema = project.faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: project.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      }
    : null;

  // Reusable "v1" template inputs — dynamic hero media (video takes priority,
  // then the project's own photo, then illustrative sample photography).
  const heroMedia: ProjectHeroMedia = project.heroVideoUrl
    ? {
        type: "video",
        videoUrl: project.heroVideoUrl,
        posterUrl: heroImage?.url ?? heroImage?.key ?? null,
      }
    : heroImage?.url || heroImage?.key
      ? {
          type: "image",
          imageUrl: heroImage.url ?? heroImage.key ?? "",
          alt: heroImage.caption ?? projectName,
        }
      : {
          type: "image",
          imageUrl: FALLBACK_HERO_IMAGE,
          alt: "Illustrative hero photo — sample content",
          isFallback: true,
        };

  const layoutAvailability = buildLayoutAvailability(units);
  const positionBreakdown = buildUnitPositionBreakdown(units);

  const layoutOptions: ProjectLayoutOption[] = layouts.map((layout, index) => ({
    id: layout.id,
    code: layout.code,
    name: layout.name,
    builtUpSqft: layout.builtUpSqft,
    bedrooms: layout.bedrooms,
    bathrooms: layout.bathrooms,
    studyRooms: layout.studyRooms,
    floorPlanUrl: layout.floorPlanUrl,
    fallbackGroup:
      FALLBACK_LAYOUT_GROUPS[index % FALLBACK_LAYOUT_GROUPS.length],
  }));

  const loanCalculatorLayouts = layouts.map((layout) => ({
    id: layout.id,
    code: layout.code,
    name: layout.name,
    builtUpSqft: layout.builtUpSqft,
    bedrooms: layout.bedrooms,
    bathrooms: layout.bathrooms,
    hasBalcony: layout.hasBalcony,
    priceFrom: layoutAvailability.get(layout.id)?.priceFrom ?? null,
    availableUnitCount:
      layoutAvailability.get(layout.id)?.availableUnitCount ?? 0,
  }));

  const galleryFromMedia = mediaItems
    .slice(1)
    .filter((media) => media.url || media.key)
    .slice(0, 2);
  const galleryPhotos: ProjectGalleryPhoto[] =
    galleryFromMedia.length > 0
      ? galleryFromMedia.map((media, index) => ({
          id: media.id,
          url: media.url ?? media.key ?? "",
          alt: media.caption ?? projectName,
          caption: media.caption ?? (index === 0 ? "Exterior" : "Facade"),
          isFallback: false,
        }))
      : FALLBACK_GALLERY_IMAGES.map((image, index) => ({
          id: `fallback-${index}`,
          url: image.url,
          alt: image.alt,
          caption: index === 0 ? "Exterior" : "Facade",
          isFallback: true,
        }));

  const nearbyPlaceItems: ProjectNearbyPlace[] = nearbyPlaces.map((place) => ({
    id: place.id,
    name: place.name,
    distanceLabel: place.distanceKm
      ? `${place.distanceKm} km`
      : "Distance updating",
  }));

  const facilityItems: ProjectFacilityItem[] = amenities
    .slice(0, 6)
    .map((amenity) => ({ id: amenity.id, name: amenity.name }));

  const facts: (ProjectFact | null)[] = [
    project.totalUnits
      ? { label: "Homes", value: `${project.totalUnits}` }
      : null,
    project.propertyTypeName
      ? { label: "Type", value: project.propertyTypeName }
      : null,
    {
      label: "From",
      value: (
        <MaskedPrice
          isAuthenticated={isAuthenticated}
          value={project.minPrice ?? "Contact for price"}
        />
      ),
    },
    project.projectStatusName
      ? { label: "Status", value: project.projectStatusName }
      : null,
  ];
  const publishedFacts = facts.filter(
    (fact): fact is ProjectFact => fact !== null,
  );

  const availabilityRows: ProjectAvailabilityRow[] = layouts.map((layout) => {
    const stats = layoutAvailability.get(layout.id);
    const status =
      stats && stats.availableUnitCount > 0
        ? `${stats.availableUnitCount} available`
        : stats && stats.totalUnitCount > 0
          ? "Fully booked"
          : "Register interest";

    return {
      id: layout.id,
      unitType: layout.name ?? layout.code,
      builtUpSqft: formatSqft(layout.builtUpSqft) ?? "\u2014",
      landAreaSqft: formatSqft(stats?.landAreaSqft),
      guidePrice: (
        <MaskedPrice
          isAuthenticated={isAuthenticated}
          value={
            formatMyr(stats?.priceFrom ?? null) ??
            project.minPrice ??
            "Contact for price"
          }
        />
      ),
      status,
    };
  });

  const directoryItems: ProjectDirectoryItem[] = [
    { id: "overview", label: "Overview", group: "Discover" },
    { id: "residence", label: "The residence", group: "Discover" },
    { id: "location", label: "Location", group: "Discover" },
    ...(layoutOptions.length > 0
      ? [{ id: "layouts", label: "Layouts", group: "The details" }]
      : []),
    ...(facilityItems.length > 0
      ? [{ id: "facilities", label: "Facilities", group: "The details" }]
      : []),
    { id: "gallery", label: "Gallery", group: "The details" },
    { id: "availability", label: "Availability", group: "Planning" },
    { id: "tools", label: "Tools", group: "Planning" },
    { id: "enquire", label: "Enquire", group: "Planning" },
  ];

  // Numbered eyebrows ("NN / Label") reflect each section's real position for
  // THIS project — Layouts/Facilities are skipped when a project has no data,
  // so a project without Layouts shows Facilities as "03", not a hardcoded "04".
  // Order matches the section order actually rendered below (Overview is unnumbered).
  const numberedSections = [
    { id: "residence", label: "The residence" },
    { id: "location", label: "Location" },
    ...(layoutOptions.length > 0 ? [{ id: "layouts", label: "Layouts" }] : []),
    ...(facilityItems.length > 0
      ? [{ id: "facilities", label: "Facilities" }]
      : []),
    { id: "gallery", label: "Gallery" },
    { id: "availability", label: "Availability" },
    { id: "tools", label: "Planning tools" },
    { id: "enquire", label: "Enquire" },
  ];
  const sectionEyebrows = new Map(
    numberedSections.map(({ id, label }, index) => [
      id,
      `${String(index + 1).padStart(2, "0")} / ${label}`,
    ]),
  );
  const eyebrowFor = (id: string) => sectionEyebrows.get(id) ?? "";

  return (
    <PriceAuthProvider>
      <div className="bg-background text-foreground">
        <StructuredData
          data={faqSchema ? [projectSchema, faqSchema] : projectSchema}
        />

        <ProjectHero
          eyebrow={`${projectName} / ${areaLabel}`}
          title={
            <>
              A higher
              <br />
              <em className="text-[#ead5a8] not-italic">standard</em>
              <br />
              of home.
            </>
          }
          description={
            project.mediaCaption ??
            "Thoughtfully designed homes built for modern family living, in a considered address."
          }
          media={heroMedia}
          scrollTargetId="residence"
        />

        <ProjectDirectoryNav
          items={directoryItems}
          groupOrder={DIRECTORY_GROUP_ORDER}
        />

        <ProjectFactsSection
          eyebrow={eyebrowFor("residence")}
          heading="Designed for"
          accentHeading="the way life expands."
          description={
            project.mediaCaption ??
            `${projectName} offers ${project.propertyTypeName ?? "homes"} in ${areaLabel}, with everyday convenience and considered design.`
          }
          facts={publishedFacts}
        />

        <ProjectLocationSection
          eyebrow={eyebrowFor("location")}
          heading="A calm address,"
          accentHeading="well connected."
          description={`Set within ${areaLabel}, ${projectName} is close to daily essentials while retaining a slower, greener rhythm.`}
          places={nearbyPlaceItems}
          pinLabel={projectName}
          regionLabel={`${areaLabel} / Malaysia`}
        />

        {layoutOptions.length > 0 ? (
          <ProjectLayoutsSection
            eyebrow={eyebrowFor("layouts")}
            heading="Space, drawn"
            accentHeading="with intention."
            description="Explore each available layout, from footprint to finish."
            layouts={layoutOptions}
          />
        ) : null}

        <ProjectFacilitiesSection
          eyebrow={eyebrowFor("facilities")}
          heading="Everyday life,"
          accentHeading="elevated."
          facilities={facilityItems}
        />

        <ProjectGallerySection
          eyebrow={eyebrowFor("gallery")}
          photos={galleryPhotos}
        />

        <ProjectAvailabilitySection
          eyebrow={eyebrowFor("availability")}
          description={`A current preview of available units and layouts at ${projectName}.`}
          sitePlanUrl={FALLBACK_SITE_PLAN_IMAGE}
          sitePlanIsFallback
          totalUnitsLabel={`${project.totalUnits || 0} homes`}
          positions={positionBreakdown}
          rows={availabilityRows}
          enquireHref="#enquire"
        />

        <ProjectToolsSection
          eyebrow={eyebrowFor("tools")}
          layouts={loanCalculatorLayouts}
          isAuthenticated={isAuthenticated}
        />

        <ProjectEnquireSection
          eyebrow={eyebrowFor("enquire")}
          projectId={project.id}
          projectName={projectName}
          whatsappHref={whatsappHref}
        />

        {relatedProjects.length > 0 ? (
          <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-6">
              <div>
                <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
                  Similar projects
                </h2>
                <p className="mt-2 text-sm text-[#172238]/60">
                  Explore other published projects across Johor Bahru.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {relatedProjects.map((item) => (
                <PublicProjectCard key={item.id} project={item} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PriceAuthProvider>
  );
}
