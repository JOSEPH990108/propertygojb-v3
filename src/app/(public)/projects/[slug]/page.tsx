import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { and, asc, eq, isNull } from "drizzle-orm";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Home,
  MapPin,
  MessageCircle,
  Ruler,
  Sparkles,
} from "lucide-react";

import { RegisterInterestForm } from "@/components/public/projects/register-interest-form";
import { db, schema } from "@/db";
import { auth } from "@/lib/auth/server";

type ProjectDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatMoney(value: string | null | undefined) {
  if (!value) {
    return "Contact for price";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "Contact for price";
  }

  return `RM ${amount.toLocaleString("en-MY", {
    maximumFractionDigits: 0,
  })}`;
}


async function getOptionalPublicUser() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return null;
    }

    const user = await db.query.user.findFirst({
      where: (table, { eq }) => eq(table.id, session.user.id),
      columns: {
        name: true,
        email: true,
        phoneNumber: true,
      },
    });

    return user ?? null;
  } catch {
    return null;
  }
}

function EmptySection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
      <Sparkles className="mx-auto size-9 text-slate-300" />
      <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { slug } = await params;

  const project = await db
    .select({
      id: schema.projects.id,
      slug: schema.projects.slug,
      name: schema.projects.name,
      displayName: schema.projects.displayName,
      legalName: schema.projects.legalName,
      address: schema.projects.address,
      totalUnits: schema.projects.totalUnits,
      launchYear: schema.projects.launchYear,
      isHotDeal: schema.projects.isHotDeal,
      developerName: schema.developers.legalName,
      propertyCategoryName: schema.propertyCategories.name,
      propertyTypeName: schema.propertyTypes.name,
      tenureName: schema.tenureTypes.name,
      titleTypeName: schema.titleTypes.name,
      projectStatusName: schema.projectStatuses.name,
      regionName: schema.regions.name,
      areaName: schema.areas.name,
    })
    .from(schema.projects)
    .innerJoin(schema.developers, eq(schema.projects.developerId, schema.developers.id))
    .leftJoin(
      schema.propertyCategories,
      eq(schema.projects.propertyCategoryId, schema.propertyCategories.id),
    )
    .leftJoin(schema.propertyTypes, eq(schema.projects.propertyTypeId, schema.propertyTypes.id))
    .leftJoin(schema.tenureTypes, eq(schema.projects.tenureTypeId, schema.tenureTypes.id))
    .leftJoin(schema.titleTypes, eq(schema.projects.titleTypeId, schema.titleTypes.id))
    .leftJoin(
      schema.projectStatuses,
      eq(schema.projects.projectStatusId, schema.projectStatuses.id),
    )
    .leftJoin(schema.regions, eq(schema.projects.regionId, schema.regions.id))
    .leftJoin(schema.areas, eq(schema.projects.areaId, schema.areas.id))
    .where(
      and(
        eq(schema.projects.slug, slug),
        eq(schema.projects.isPublished, true),
        isNull(schema.projects.deletedAt),
      ),
    )
    .limit(1);

  const projectData = project[0];

  if (!projectData) {
    notFound();
  }

  const [
    mediaItems,
    layouts,
    units,
    amenities,
    tags,
    nearbyPlaces,
  ] = await Promise.all([
    db
      .select({
        id: schema.projectMedia.id,
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
        basePrice: schema.units.basePrice,
        finalPrice: schema.units.finalPrice,
        builtUpSqft: schema.units.builtUpSqft,
        landAreaSqft: schema.units.landAreaSqft,
        dimensionText: schema.units.dimensionText,
        bookingStatusCode: schema.bookingStatuses.code,
        bookingStatusName: schema.bookingStatuses.name,
        lotTypeName: schema.lotTypes.name,
        positionTypeName: schema.unitPositions.name,
      })
      .from(schema.units)
      .leftJoin(schema.bookingStatuses, eq(schema.units.bookingStatusId, schema.bookingStatuses.id))
      .leftJoin(schema.lotTypes, eq(schema.units.lotTypeId, schema.lotTypes.id))
      .leftJoin(schema.unitPositions, eq(schema.units.positionTypeId, schema.unitPositions.id))
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
      .orderBy(
        asc(schema.projectNearbyPlaces.sortOrder),
        asc(schema.projectNearbyPlaces.name),
      ),
  ]);

  const currentUser = await getOptionalPublicUser();

  const projectName = projectData.displayName ?? projectData.name;
  const heroMedia = mediaItems[0];
  const heroImageUrl = heroMedia?.url ?? heroMedia?.key ?? null;
  const location =
    [projectData.areaName, projectData.regionName].filter(Boolean).join(", ") ||
    "Location updating soon";

  const prices = units
    .map((unit) => Number(unit.finalPrice ?? unit.basePrice))
    .filter((price) => Number.isFinite(price) && price > 0);
  const minPrice = prices.length ? String(Math.min(...prices)) : null;
  const availableUnits = units.filter(
    (unit) => unit.bookingStatusCode === "AVAILABLE",
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative min-h-[620px] overflow-hidden bg-slate-950 text-white">
        {heroImageUrl ? (
          <Image
            src={heroImageUrl}
            alt={heroMedia?.caption ?? projectName}
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover opacity-55"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-900 to-blue-600" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

        <div className="relative mx-auto flex min-h-[620px] max-w-7xl flex-col justify-end px-6 py-12">
          <Link
            href="/projects"
            className="mb-8 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
          >
            <ArrowLeft className="size-4" />
            Back to Projects
          </Link>

          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-2">
              {projectData.isHotDeal ? (
                <span className="rounded-full bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white">
                  Hot Deal
                </span>
              ) : null}

              {tags.slice(0, 4).map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-wide text-white backdrop-blur"
                >
                  {tag.name}
                </span>
              ))}
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
              {projectName}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-100">
              {projectData.developerName ?? "Developer updating soon"} · {location}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={`https://wa.me/60104608699?text=${encodeURIComponent(
                  `Hi, I am interested in ${projectName}. Please send me more details.`,
                )}`}
                target="_blank"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-black text-white shadow-xl transition hover:bg-blue-700"
              >
                <MessageCircle className="size-5" />
                WhatsApp Enquiry
              </a>

              <Link
                href="/book-viewing"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-6 text-sm font-black text-white backdrop-blur transition hover:bg-white/20"
              >
                Book Viewing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-4">
        {[
          ["Price", formatMoney(minPrice)],
          ["Property Type", projectData.propertyTypeName ?? "Updating soon"],
          ["Tenure", projectData.tenureName ?? "Updating soon"],
          ["Total Units", `${projectData.totalUnits || units.length || 0} units`],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              {label}
            </p>
            <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-14 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-8">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Project Overview
            </h2>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="flex gap-3">
                <MapPin className="mt-1 size-5 text-blue-600" />
                <div>
                  <p className="font-black text-slate-950">Location</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {projectData.address ?? location}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Home className="mt-1 size-5 text-blue-600" />
                <div>
                  <p className="font-black text-slate-950">Category</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {projectData.propertyCategoryName ?? "Updating soon"} ·{" "}
                    {projectData.propertyTypeName ?? "Updating soon"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Building2 className="mt-1 size-5 text-blue-600" />
                <div>
                  <p className="font-black text-slate-950">Developer</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {projectData.developerName ?? "Updating soon"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle2 className="mt-1 size-5 text-blue-600" />
                <div>
                  <p className="font-black text-slate-950">Status</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {projectData.projectStatusName ?? "Updating soon"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Gallery
            </h2>

            {mediaItems.length === 0 ? (
              <div className="mt-6">
                <EmptySection
                  title="Gallery updating soon"
                  description="Project images will be added soon."
                />
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {mediaItems.slice(0, 6).map((media) => {
                  const imageUrl = media.url ?? media.key;

                  return (
                    <div
                      key={media.id}
                      className="relative h-64 overflow-hidden rounded-[1.5rem] bg-slate-100"
                    >
                      <Image
                        src={imageUrl}
                        alt={media.caption ?? projectName}
                        fill
                        unoptimized
                        sizes="(min-width: 768px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Layouts & Floor Plans
            </h2>

            {layouts.length === 0 ? (
              <div className="mt-6">
                <EmptySection
                  title="Floor plans updating soon"
                  description="Layouts and built-up information will be added soon."
                />
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {layouts.map((layout) => (
                  <div
                    key={layout.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-black text-slate-950">
                          {layout.name ?? layout.code}
                        </h3>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {layout.bedrooms} Bedrooms · {layout.bathrooms} Bathrooms
                          {layout.studyRooms ? ` · ${layout.studyRooms} Study` : ""}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">
                          <Ruler className="size-4" />
                          {layout.builtUpSqft} sqft
                        </span>

                        {layout.layoutTypeName ? (
                          <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
                            {layout.layoutTypeName}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Unit Pricing
            </h2>

            {units.length === 0 ? (
              <div className="mt-6">
                <EmptySection
                  title="Unit pricing updating soon"
                  description="Available unit prices will be added soon."
                />
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
                <div className="grid grid-cols-4 bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white">
                  <span>Unit</span>
                  <span>Type</span>
                  <span>Status</span>
                  <span className="text-right">Price</span>
                </div>

                {units.slice(0, 12).map((unit) => (
                  <div
                    key={unit.id}
                    className="grid grid-cols-4 border-t border-slate-100 px-4 py-3 text-sm"
                  >
                    <span className="font-bold text-slate-950">{unit.unitNo}</span>
                    <span className="text-slate-500">
                      {unit.positionTypeName ?? unit.lotTypeName ?? "-"}
                    </span>
                    <span className="text-slate-500">
                      {unit.bookingStatusName ?? "-"}
                    </span>
                    <span className="text-right font-black text-blue-700">
                      {formatMoney(unit.finalPrice ?? unit.basePrice)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {units.length > 12 ? (
              <p className="mt-4 text-sm font-semibold text-slate-500">
                Showing first 12 units. Contact us for the full availability list.
              </p>
            ) : null}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="sticky top-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              Register Interest
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Submit your details to get the latest brochure, price list, and
              available units.
            </p>

            <div className="mt-6">
              <RegisterInterestForm
                projectId={projectData.id}
                projectName={projectName}
                initialName={currentUser?.name ?? ""}
                initialPhoneNumber={currentUser?.phoneNumber ?? ""}
                initialEmail={currentUser?.email ?? ""}
              />
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Available Units
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {availableUnits.length || "-"}
              </p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              Amenities
            </h2>

            {amenities.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                Amenities updating soon.
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {amenities.map((amenity) => (
                  <span
                    key={amenity.id}
                    className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700"
                  >
                    {amenity.name}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              Nearby Places
            </h2>

            {nearbyPlaces.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                Nearby places updating soon.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {nearbyPlaces.map((place) => (
                  <div
                    key={place.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <p className="font-black text-slate-950">{place.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {place.category}
                      {place.distanceKm ? ` · ${place.distanceKm} km` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </section>
    </main>
  );
}
