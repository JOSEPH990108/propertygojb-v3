import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Building2, MapPin, MessageCircle, Star } from "lucide-react";

import { AppReveal } from "@/components/common/app-reveal";
import { PublicEnquiryForm } from "@/components/public/public-enquiry-form";
import { PublicProjectCard } from "@/components/public/public-project-card";
import { StructuredData } from "@/components/public/structured-data";
import { getPublicUrl, publicSiteConfig } from "@/config/public-site";
import {
  getPublicProjectBySlug,
  getPublicProjectCatalog,
  getPublicProjectPageTitle,
} from "@/lib/public/projects";
import { getPublicWhatsAppHref } from "@/lib/public/site";
import { buildPublicPageMetadata } from "@/lib/public/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
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
  const canonical = detail.project.canonicalUrl ?? getPublicUrl(`/projects/${slug}`);

  return buildPublicPageMetadata({
    title: detail.project.metaTitle ?? getPublicProjectPageTitle(name),
    description,
    path: `/projects/${slug}`,
    canonicalUrl: canonical,
    socialTitle: detail.project.ogTitle ?? detail.project.metaTitle ?? name,
    socialDescription: detail.project.ogDescription ?? description,
    images: detail.project.ogImageUrl ? [{ url: detail.project.ogImageUrl }] : undefined,
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

  const { project, mediaItems, layouts, amenities, nearbyPlaces } = detail;
  const catalog = await getPublicProjectCatalog();
  const relatedProjects = catalog.filter((item) => item.id !== project.id).slice(0, 3);
  const heroImage = mediaItems[0];
  const whatsappHref = getPublicWhatsAppHref(
    `Hi, I am interested in ${project.displayName ?? project.name}. Please share more details.`,
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

  return (
    <div className="bg-muted/40">
      <StructuredData data={faqSchema ? [projectSchema, faqSchema] : projectSchema} />
      <section className="relative overflow-hidden bg-slate-950 px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.35),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_26%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <AppReveal>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-100">
              PropertyGoJB Project
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              {project.displayName ?? project.name}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              {project.mediaCaption ??
                "Explore project details, floor plans, and available units for this Johor Bahru new launch."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 backdrop-blur">
                <MapPin className="size-4" />
                {[project.areaName, project.regionName].filter(Boolean).join(", ") || "Location updating soon"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 backdrop-blur">
                <Building2 className="size-4" />
                {project.developerName ?? "Developer updating soon"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 backdrop-blur">
                <Star className="size-4" />
                {project.projectStatusName ?? "Status updating soon"}
              </span>
            </div>
          </AppReveal>

          <AppReveal delay={0.1} className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-100">
              Starting From
            </p>
            <p className="mt-3 text-4xl font-black tracking-tight text-white">
              {project.minPrice ?? "Contact for price"}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {project.totalUnits || 0} total units · {layouts.length} layouts · {project.availableUnitCount} available
            </p>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-600"
            >
              <MessageCircle className="size-4" />
              WhatsApp Enquiry
            </a>
          </AppReveal>
        </div>
      </section>

      <AppReveal className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-8">
          <div className="overflow-hidden rounded-[2rem] border border-border bg-background shadow-sm">
            <div className="relative aspect-[16/9] bg-muted">
              {project.heroVideoUrl ? (
                <video
                  src={project.heroVideoUrl}
                  poster={heroImage?.url ?? heroImage?.key ?? undefined}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  className="size-full object-cover"
                />
              ) : heroImage?.url || heroImage?.key ? (
                <Image
                  src={heroImage.url ?? heroImage.key ?? ""}
                  alt={heroImage.caption ?? project.displayName ?? project.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
                  <Building2 className="size-20 text-blue-200" />
                </div>
              )}
            </div>
          </div>

          <section className="rounded-[2rem] border border-border bg-background p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              Project Highlights
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[project.propertyTypeName, project.tenureName, project.titleTypeName]
                .filter(Boolean)
                .map((item) => (
                  <div
                    key={item as string}
                    className="rounded-2xl border border-border bg-muted/50 p-4 text-sm font-semibold text-foreground"
                  >
                    {item}
                  </div>
                ))}
            </div>
          </section>

          {project.highlights.length > 0 ? (
            <section className="rounded-[2rem] border border-border bg-background p-6 shadow-sm">
              <h2 className="text-2xl font-black tracking-tight text-foreground">Why this project stands out</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {project.highlights.map((highlight) => (
                  <div key={highlight} className="flex items-start gap-3 rounded-2xl bg-blue-50 p-4 text-sm font-bold text-blue-950 dark:bg-blue-950/40 dark:text-blue-100">
                    <Star className="mt-0.5 size-4 shrink-0 text-blue-600" />
                    {highlight}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-[2rem] border border-border bg-background p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-foreground">Layouts</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {layouts.length > 0 ? (
                layouts.map((layout) => (
                  <div
                    key={layout.id}
                    className="rounded-2xl border border-border bg-muted/50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-black text-foreground">{layout.code}</h3>
                        <p className="text-sm text-muted-foreground">{layout.name}</p>
                      </div>
                      <p className="text-sm font-black text-blue-700">
                        {layout.builtUpSqft} sqft
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-muted-foreground">
                      <span className="rounded-full bg-background px-3 py-1">{layout.bedrooms} BR</span>
                      <span className="rounded-full bg-background px-3 py-1">{layout.bathrooms} Bath</span>
                      {layout.isDualKey ? (
                        <span className="rounded-full bg-background px-3 py-1">Dual Key</span>
                      ) : null}
                      {layout.hasBalcony ? <span className="rounded-full bg-background px-3 py-1">Balcony</span> : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Layouts updating soon.</p>
              )}
            </div>
          </section>

          {["elmora-condominium", "paragon-signature-suites", "sunway-lakehills", "sunway-lakehills-phase-1"].includes(project.slug) ? (
            <Link
              href={`/projects/${project.slug}/availability`}
              className="inline-flex w-full items-center justify-between border border-blue-200 bg-blue-50 px-6 py-5 text-blue-950 transition hover:border-blue-400 hover:bg-blue-100"
            >
              <span>
                <span className="block text-lg font-black">Live tower availability</span>
                <span className="mt-1 block text-sm font-semibold text-blue-800">Browse floors, stacks, current unit status, and pricing.</span>
              </span>
              <ArrowRight className="size-5 shrink-0" />
            </Link>
          ) : null}

          {project.faqs.length > 0 ? (
            <section className="rounded-[2rem] border border-border bg-background p-6 shadow-sm">
              <h2 className="text-2xl font-black tracking-tight text-foreground">Frequently asked questions</h2>
              <div className="mt-6 divide-y divide-border">
                {project.faqs.map((faq) => (
                  <details key={faq.question} className="group py-4">
                    <summary className="cursor-pointer list-none font-black text-foreground">{faq.question}</summary>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-[2rem] border border-border bg-background p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-foreground">Amenities</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {amenities.length > 0 ? (
                amenities.map((amenity) => (
                  <span
                    key={amenity.id}
                    className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-200"
                  >
                    {amenity.name}
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Amenities updating soon.</p>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-border bg-background p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-foreground">Nearby Places</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {nearbyPlaces.length > 0 ? (
                nearbyPlaces.map((place) => (
                  <div
                    key={place.id}
                    className="rounded-2xl border border-border bg-muted/50 p-4"
                  >
                    <p className="font-black text-foreground">{place.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{place.category}</p>
                    <p className="mt-2 text-sm font-bold text-blue-700">
                      {place.distanceKm ? `${place.distanceKm} km away` : "Distance updating"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nearby places updating soon.</p>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <PublicEnquiryForm
            projectId={project.id}
            projectName={project.displayName ?? project.name}
            introTitle="Register your interest"
            introDescription="Share your details and we will contact you with the latest availability, brochure, and pricing."
          />

          <section className="rounded-[2rem] border border-border bg-background p-6 shadow-sm">
            <h3 className="text-lg font-black text-foreground">Need instant help?</h3>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 font-black text-white transition hover:bg-emerald-600"
            >
              <MessageCircle className="size-4" />
              WhatsApp now
            </a>
          </section>
        </aside>
      </AppReveal>

      {relatedProjects.length > 0 ? (
        <AppReveal className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                Similar Projects
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Explore other published projects across Johor Bahru.
              </p>
            </div>
            <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-black text-blue-700">
              View all
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {relatedProjects.map((item) => (
              <PublicProjectCard key={item.id} project={item} />
            ))}
          </div>
        </AppReveal>
      ) : null}
    </div>
  );
}
