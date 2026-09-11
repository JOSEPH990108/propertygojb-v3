import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  HeartHandshake,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import { AppButton } from "@/components/common/app-button";
import { AppReveal } from "@/components/common/app-reveal";
import { publicContent } from "@/config/public-content";
import { PublicCategoryCollectionCard } from "@/components/public/public-category-collection-card";
import { PublicEnquiryForm } from "@/components/public/public-enquiry-form";
import { PublicFeaturedProjectsCarousel } from "@/components/public/public-featured-projects-carousel";
import { PublicProjectQuickSearch } from "@/components/public/public-project-quick-search";
import { getPublicHeroImage } from "@/lib/public/hero-image";
import {
  PUBLIC_SITE_NAME,
  buildProjectEnquiryMessage,
  getPublicWhatsAppHref,
} from "@/lib/public/site";
import {
  buildPublicProjectFilterOptions,
  getPublicProjectCatalog,
} from "@/lib/public/projects";
import { buildPublicPageMetadata } from "@/lib/public/seo";

export const metadata = buildPublicPageMetadata({
  title: "Johor Bahru New Launch Projects",
  description:
    "Discover new launch projects, compare layouts, and enquire directly with PropertyGoJB.",
  path: "/",
  socialTitle: "PropertyGoJB | Johor Bahru New Launch Projects",
});

const benefitIcons = {
  verified: BadgeCheck,
  support: HeartHandshake,
  guidance: ShieldCheck,
} satisfies Record<
  (typeof publicContent.home.benefits)[number]["icon"],
  typeof BadgeCheck
>;

const journeyHighlights = [
  "Project brochures",
  "Price guidance",
  "Available units",
  "Viewing support",
];

const CATEGORY_ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI"];

// Only these two categories are shown as a "ways to live" split (matches the
// reference direction); other real categories (Residential/Commercial/Mixed)
// stay fully browsable via /projects but don't get a homepage card here.
const COLLECTION_CATEGORIES: Record<
  string,
  { label: string; fallbackImage: string }
> = {
  "high rise": {
    label: "High Rise",
    fallbackImage: "/images/defaults/highrise-interior.png",
  },
  landed: { label: "Landed", fallbackImage: "/images/defaults/landed-estate.png" },
};

// Short, generic copy per category — no per-project stats invented here.
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "High Rise":
    "Condominiums and serviced apartments across Johor Bahru's high-rise developments — lock-up-and-go living with shared facilities and skyline or straits views.",
  Landed:
    "Terrace, semi-detached, and bungalow homes with your own land title — more space, your own gate, and room for the family to grow.",
};

function getCategoryDescription(categoryName: string) {
  return (
    CATEGORY_DESCRIPTIONS[categoryName] ??
    `Explore ${categoryName} projects currently published on PropertyGoJB.`
  );
}

export default async function HomePage() {
  const catalog = await getPublicProjectCatalog();
  const featuredProjects = catalog.slice(0, 3);
  const { regionOptions } = buildPublicProjectFilterOptions(catalog);
  const projectOptions = catalog.slice(0, 12).map((project) => ({
    id: project.id,
    name: project.name,
    displayName: project.displayName,
  }));

  const availableUnitCount = catalog.reduce(
    (sum, project) => sum + project.availableUnitCount,
    0,
  );
  const hotDealCount = catalog.filter((project) => project.isHotDeal).length;

  // Real High Rise / Landed split from the published catalog only — counts and
  // unit totals come from actual projects; imagery falls back to curated stock
  // photography only when a category has no real project photo yet.
  const categoryGroups = Array.from(
    catalog
      .reduce((groups, project) => {
        const match = project.propertyCategoryName
          ? COLLECTION_CATEGORIES[project.propertyCategoryName.toLowerCase()]
          : undefined;

        if (!match) {
          return groups;
        }

        const existing = groups.get(match.label);

        if (existing) {
          existing.projectCount += 1;
          existing.availableUnitCount += project.availableUnitCount;
          existing.imageUrl ??= project.mediaUrl;
          existing.imageAlt ??=
            project.mediaCaption ?? project.displayName ?? project.name;
        } else {
          groups.set(match.label, {
            categoryName: match.label,
            projectCount: 1,
            availableUnitCount: project.availableUnitCount,
            imageUrl: project.mediaUrl,
            imageAlt:
              project.mediaCaption ?? project.displayName ?? project.name,
            fallbackImage: match.fallbackImage,
          });
        }

        return groups;
      }, new Map<string, { categoryName: string; projectCount: number; availableUnitCount: number; imageUrl: string | null; imageAlt: string; fallbackImage: string }>())
      .values(),
  ).sort((a, b) => b.projectCount - a.projectCount);

  const whatsappHref = getPublicWhatsAppHref(
    buildProjectEnquiryMessage(
      PUBLIC_SITE_NAME,
      "Please share your current project recommendations.",
    ),
  );
  const heroImage = getPublicHeroImage();

  return (
    <div>
      <section className="relative isolate overflow-hidden bg-public-hero text-public-hero-foreground">
        <div className="relative">
          <Image
            src={heroImage.src}
            alt="Lifestyle photo of a modern home with a swimming pool, terrace, and palm trees under a clear sky"
            fill
            preload
            unoptimized={heroImage.unoptimized}
            sizes="100vw"
            className="object-cover object-[center_25%]"
          />

          {/* Directional overlay: darkest on the left where text sits, fading
              right and up to keep the architecture visible (see redesign brief).
              Source (default homepage-hero.jpg): pexels.com/photo/luxury-house-with-pool-24807128
              — Ahmet Çötür (Pexels license, general lifestyle imagery, not a
              project photo). Update this note if that file is replaced. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-black/5"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent"
          />
          {/* Top scrim: the shell's header floats transparently over this hero
              (see public-shell.tsx overlay phase); the photo has bright sky/
              facade areas across its width, so without this the light header
              text/buttons lose contrast in places. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 to-transparent sm:h-40"
          />

          <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-end px-4 pt-28 pb-16 sm:px-6 lg:px-8 lg:pt-32 lg:pb-24">
            <AppReveal>
              <div className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-public-hero-accent">
                <span
                  aria-hidden="true"
                  className="h-px w-8 bg-public-hero-accent"
                />
                PropertyGoJB · Johor Bahru new launch desk
              </div>

              <h1 className="mt-6 max-w-xl font-serif text-4xl leading-[1.08] font-medium tracking-tight sm:text-5xl lg:text-6xl">
                Find your place in Johor Bahru.
              </h1>

              <p className="mt-6 max-w-lg text-base leading-8 text-public-hero-foreground/85 sm:text-lg">
                Explore new launches, compare layouts, and find a home that fits
                your plans.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {/* Documented fixed hero exception: the hero surface is always dark,
                    so its primary button uses a light fill with dark ink text
                    regardless of the light/dark preference (see redesign brief). */}
                <AppButton
                  asChild
                  appSize="lg"
                  className="rounded-none bg-public-hero-foreground text-[#1b1c19] shadow-none hover:brightness-95"
                >
                  <Link href="/projects">
                    Explore projects
                    <ArrowRight className="size-4" />
                  </Link>
                </AppButton>

                <AppButton
                  asChild
                  appVariant="ghost"
                  appSize="lg"
                  className="rounded-none bg-transparent text-public-hero-foreground/85 hover:bg-public-hero-foreground/10 hover:text-public-hero-foreground"
                >
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    WhatsApp enquiry
                  </a>
                </AppButton>
              </div>

              <p className="mt-10 text-xs text-public-hero-foreground/50">
                Lifestyle image
              </p>
            </AppReveal>
          </div>
        </div>
      </section>

      {/* No overlap margin: the hero is a full viewport-height section (see
          min-h-screen above), so this section must start flush below it,
          not pull up into it, or it would show within the first screen. */}
      <section className="relative border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <p className="text-sm font-medium text-muted-foreground lg:hidden">
            Search by location, then refine filters on the full listing page.
          </p>
          <div className="mt-4 lg:mt-0">
            <PublicProjectQuickSearch regionOptions={regionOptions} />
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <AppReveal>
            <p className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.32em] text-public-decorative">
              <span
                aria-hidden="true"
                className="h-px w-8 bg-public-decorative"
              />
              Our Approach
            </p>
            <p className="mt-6 font-serif text-2xl leading-snug font-medium tracking-tight text-balance text-foreground sm:text-3xl">
              We don&apos;t just list units. We help you shortlist the right
              project — the layout that fits your family, the launch price that
              fits your budget, and a team that answers before you have to ask
              twice.
            </p>
          </AppReveal>
        </div>
      </section>

      {categoryGroups.length >= 2 ? (
        <section className="bg-background py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AppReveal className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="mb-3 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.32em] text-public-decorative">
                  <span
                    aria-hidden="true"
                    className="h-px w-8 bg-public-decorative"
                  />
                  Browse by Type
                </p>
                <h2 className="font-serif text-4xl font-medium tracking-tight text-foreground lg:text-5xl">
                  Two ways to call Johor Bahru home.
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Every published project sorted into the collection that fits how
                you want to live.
              </p>
            </AppReveal>

            <div className="grid gap-6 lg:grid-cols-2">
              {categoryGroups.map((group, index) => (
                <PublicCategoryCollectionCard
                  key={group.categoryName}
                  index={CATEGORY_ROMAN_NUMERALS[index] ?? String(index + 1)}
                  categoryName={group.categoryName}
                  projectCount={group.projectCount}
                  availableUnitCount={group.availableUnitCount}
                  description={getCategoryDescription(group.categoryName)}
                  imageUrl={group.imageUrl ?? group.fallbackImage}
                  imageAlt={group.imageAlt}
                  href={`/projects?q=${encodeURIComponent(group.categoryName)}`}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <AppReveal className="flex items-end justify-between gap-6">
          <div>
            <p className="inline-flex items-center gap-3 text-sm font-bold uppercase tracking-[0.22em] text-public-decorative">
              <span
                aria-hidden="true"
                className="h-px w-8 bg-public-decorative"
              />
              Featured Projects
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              Projects worth shortlisting
            </h2>
          </div>

          <Link
            href="/projects"
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-semibold text-foreground transition hover:text-muted-foreground"
          >
            View all
            <ArrowRight className="size-4" />
          </Link>
        </AppReveal>

        {featuredProjects.length > 0 ? (
          <AppReveal delay={0.08} className="mt-10">
            <PublicFeaturedProjectsCarousel projects={featuredProjects} />
          </AppReveal>
        ) : (
          <div className="mt-10 rounded-none border border-dashed border-border bg-card p-12 text-center">
            <Building2 className="mx-auto size-10 text-muted-foreground/40" />
            <h3 className="mt-4 text-xl font-semibold text-foreground">
              Projects updating soon
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Publish a project in the admin portal to feature it here.
            </p>
          </div>
        )}
      </section>

      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <AppReveal className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-3 text-sm font-bold uppercase tracking-[0.22em] text-public-decorative">
                <span
                  aria-hidden="true"
                  className="h-px w-8 bg-public-decorative"
                />
                Why PropertyGoJB
              </p>
              <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                Built for buyers, not just browsing.
              </h2>
            </div>

            <p className="text-sm font-medium text-muted-foreground">
              {catalog.length} published projects · {availableUnitCount}{" "}
              available units · {hotDealCount} hot deals
            </p>
          </AppReveal>

          <AppReveal
            delay={0.06}
            className="mt-10 divide-y divide-border border-t border-border"
          >
            {publicContent.home.benefits.map((item) => {
              const Icon = benefitIcons[item.icon];

              return (
                <div key={item.title} className="flex items-start gap-4 py-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-none bg-background text-foreground">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}

            <div className="flex items-start gap-4 py-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-none bg-background text-foreground">
                <MapPin className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Live support
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  WhatsApp follow-up and guided project matching whenever you
                  have a question.
                </p>
              </div>
            </div>
          </AppReveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <AppReveal className="rounded-none bg-public-hero p-8 text-public-hero-foreground sm:p-10">
          <p className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-public-hero-accent">
            <span
              aria-hidden="true"
              className="h-px w-8 bg-public-hero-accent"
            />
            Buyer journey
          </p>
          <h3 className="mt-3 font-serif text-2xl font-medium tracking-tight sm:text-3xl">
            A simple path from search to enquiry.
          </h3>

          <ol className="mt-8 divide-y divide-public-hero-foreground/10 border-t border-public-hero-foreground/10">
            {publicContent.home.journeySteps.map((step, index) => (
              <li key={step} className="flex gap-4 py-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-public-hero-foreground/20 text-sm font-semibold">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-public-hero-foreground/85">
                  {step}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap gap-2">
            {journeyHighlights.map((tag) => (
              <span
                key={tag}
                className="rounded-none border border-public-hero-accent/40 px-3 py-1 text-xs font-medium text-public-hero-accent"
              >
                {tag}
              </span>
            ))}
          </div>
        </AppReveal>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:px-8">
          <AppReveal>
            <p className="inline-flex items-center gap-3 text-sm font-bold uppercase tracking-[0.22em] text-public-decorative">
              <span
                aria-hidden="true"
                className="h-px w-8 bg-public-decorative"
              />
              Get in touch
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              Find a project that fits your plans.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
              Use the enquiry form, project listings, or WhatsApp to move
              straight into a guided conversation with the PropertyGoJB team.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <AppButton asChild appSize="lg" className="rounded-none px-6">
                <Link href="/contact">Open Enquiry Form</Link>
              </AppButton>
              <AppButton
                asChild
                appVariant="outline"
                appSize="lg"
                className="rounded-none px-6"
              >
                <a href={whatsappHref} target="_blank" rel="noreferrer">
                  WhatsApp Now
                </a>
              </AppButton>
            </div>
          </AppReveal>

          <AppReveal delay={0.1}>
            <PublicEnquiryForm
              projectOptions={projectOptions}
              introTitle="Send a general enquiry"
              introDescription="Choose a project and tell us what you need. We will contact you with the latest details."
              submitLabel="Request Callback"
            />
          </AppReveal>
        </div>
      </section>
    </div>
  );
}
