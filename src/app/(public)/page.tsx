import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { AppButton } from "@/components/common/app-button";
import { AppReveal } from "@/components/common/app-reveal";
import { publicContent } from "@/config/public-content";
import { PublicEnquiryForm } from "@/components/public/public-enquiry-form";
import { PublicProjectCard } from "@/components/public/public-project-card";
import { PublicProjectQuickSearch } from "@/components/public/public-project-quick-search";
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
} satisfies Record<(typeof publicContent.home.benefits)[number]["icon"], typeof BadgeCheck>;

export default async function HomePage() {
  const catalog = await getPublicProjectCatalog();
  const featuredProjects = catalog.slice(0, 3);
  const { regionOptions } = buildPublicProjectFilterOptions(catalog);
  const projectOptions = catalog.slice(0, 12).map((project) => ({
    id: project.id,
    name: project.name,
    displayName: project.displayName,
  }));

  const whatsappHref = getPublicWhatsAppHref(
    buildProjectEnquiryMessage(
      PUBLIC_SITE_NAME,
      "Please share your current project recommendations.",
    ),
  );

  return (
    <div>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.35),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.4),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:py-24">
          <AppReveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.26em] text-blue-100 backdrop-blur">
              <Sparkles className="size-4" />
              PropertyGoJB · Johor Bahru new launch desk
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Find the right Johor Bahru project faster.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
              Compare new launch projects, review layouts and pricing cues, and send an enquiry in one premium, buyer-friendly flow.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <AppButton asChild className="h-12 rounded-full px-6">
                <Link href="/projects">
                  Browse Projects
                  <ArrowRight className="size-4" />
                </Link>
              </AppButton>

              <AppButton asChild appVariant="outline" className="h-12 rounded-full px-6">
                <a href={whatsappHref} target="_blank" rel="noreferrer">
                  WhatsApp Enquiry
                </a>
              </AppButton>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                {
                  value: `${catalog.length}`,
                  label: "Published projects",
                },
                {
                  value: `${catalog.reduce((sum, project) => sum + project.availableUnitCount, 0)}`,
                  label: "Available units",
                },
                {
                  value: `${catalog.filter((project) => project.isHotDeal).length}`,
                  label: "Hot deals",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur"
                >
                  <p className="text-2xl font-black">{item.value}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-300">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </AppReveal>

          <AppReveal delay={0.12} className="space-y-4">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-100">
                Quick Search
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Start with a location, then move to the full listing page for refined filters.
              </p>

              <div className="mt-5">
                <PublicProjectQuickSearch regionOptions={regionOptions} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-background p-5 text-foreground shadow-2xl shadow-blue-950/30">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                  <MapPin className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-black text-foreground">Live support</p>
                  <p className="text-sm text-muted-foreground">
                    WhatsApp follow-up and guided project matching.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] bg-muted p-4 text-sm leading-7 text-muted-foreground">
                New launch projects, available layouts, and enquiry handling are all connected to the existing CRM pipeline.
              </div>
            </div>
          </AppReveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <AppReveal className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-600">
              Featured Projects
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Projects worth shortlisting
            </h2>
          </div>

          <Link
            href="/projects"
            className="hidden items-center gap-2 text-sm font-black text-blue-700 transition hover:text-blue-800 md:inline-flex"
          >
            View all
            <ArrowRight className="size-4" />
          </Link>
        </AppReveal>

        {featuredProjects.length > 0 ? (
          <AppReveal delay={0.08} className="mt-8 grid gap-6 lg:grid-cols-3">
            {featuredProjects.map((project) => (
              <PublicProjectCard key={project.id} project={project} />
            ))}
          </AppReveal>
        ) : (
          <div className="mt-8 rounded-[2rem] border border-dashed border-border bg-background p-12 text-center shadow-sm">
            <Building2 className="mx-auto size-10 text-slate-300" />
            <h3 className="mt-4 text-xl font-black text-foreground">
              Projects updating soon
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Publish a project in the admin portal to feature it here.
            </p>
          </div>
        )}
      </section>

      <section className="bg-background">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:px-8">
          <AppReveal>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-600">
              Why PropertyGoJB
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Built for trust, clarity, and conversion.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
              Everything on the public website is designed to help buyers find a project quickly and move from browsing to enquiry without friction.
            </p>

            <div className="mt-8 space-y-4">
              {publicContent.home.benefits.map((item) => {
                const Icon = benefitIcons[item.icon];

                return (
                  <div
                    key={item.title}
                    className="rounded-[1.5rem] border border-border bg-muted/50 p-5"
                  >
                    <div className="flex items-start gap-4">
                      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-background text-blue-700 shadow-sm">
                        <Icon className="size-5" />
                      </span>
                      <div>
                        <h3 className="text-lg font-black text-foreground">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </AppReveal>

          <AppReveal delay={0.1} className="rounded-[2rem] border border-slate-800 bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/20">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
              Buyer journey
            </p>
            <h3 className="mt-3 text-2xl font-black tracking-tight">
              A simple path from search to enquiry.
            </h3>

            <div className="mt-8 space-y-4">
              {publicContent.home.journeySteps.map((step, index) => (
                <div
                  key={step}
                  className="flex gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-blue-600 text-sm font-black">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-slate-200">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[1.5rem] bg-white p-5 text-slate-950">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
                What you get
              </p>
              <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <span>Project brochures</span>
                <span>Price guidance</span>
                <span>Available units</span>
                <span>Viewing support</span>
              </div>
            </div>
          </AppReveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <AppReveal className="rounded-[2rem] bg-gradient-to-br from-blue-600 via-blue-700 to-slate-950 p-8 text-white shadow-2xl shadow-blue-900/20 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                CTA
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Ready to short-list your next Johor Bahru project?
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100">
                Use the enquiry form, project listings, or WhatsApp to move straight into a guided conversation with the PropertyGoJB team.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <AppButton asChild className="h-12 rounded-full px-6">
                  <Link href="/contact">Open Enquiry Form</Link>
                </AppButton>
                <AppButton
                  asChild
                  appVariant="outline"
                  className="h-12 rounded-full border-white/20 bg-white/10 px-6 text-white hover:bg-white/20"
                >
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    WhatsApp Now
                  </a>
                </AppButton>
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-background p-4 text-foreground shadow-xl">
              <PublicEnquiryForm
                projectOptions={projectOptions}
                introTitle="Send a general enquiry"
                introDescription="Choose a project and tell us what you need. We will contact you with the latest details."
                submitLabel="Request Callback"
              />
            </div>
          </div>
        </AppReveal>
      </section>
    </div>
  );
}
