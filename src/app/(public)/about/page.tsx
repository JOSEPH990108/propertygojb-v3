import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, HeartHandshake, SearchCheck } from "lucide-react";

import { AppReveal } from "@/components/common/app-reveal";
import { publicContent } from "@/config/public-content";
import { getPublicProjectCatalog } from "@/lib/public/projects";
import { buildPublicPageMetadata } from "@/lib/public/seo";

export const metadata = buildPublicPageMetadata({
  title: "About",
  description: "Learn how PropertyGoJB helps buyers discover and compare verified Johor Bahru property projects.",
  path: "/about",
});

const principleIcons = {
  search: SearchCheck,
  catalog: BadgeCheck,
  support: HeartHandshake,
  scale: Building2,
} satisfies Record<(typeof publicContent.about.principles)[number]["icon"], typeof Building2>;

export default async function AboutPage() {
  const projects = await getPublicProjectCatalog();
  const availableUnits = projects.reduce((total, project) => total + project.availableUnitCount, 0);

  return (
    <div className="bg-background text-foreground">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(37,99,235,0.4),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <AppReveal className="max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-blue-200">About PropertyGoJB</p>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">Property decisions deserve clearer information and a faster human response.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">PropertyGoJB connects live project data, practical comparison tools, and direct enquiry support for buyers exploring Johor Bahru.</p>
          </AppReveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <AppReveal className="grid gap-6 md:grid-cols-3">
          {[{ value: projects.length, label: "Published projects" }, { value: availableUnits, label: "Available units" }, { value: projects.filter((project) => project.isHotDeal).length, label: "Current hot deals" }].map((fact) => (
            <div key={fact.label} className="border-l-4 border-blue-600 bg-muted/50 p-6">
              <p className="text-4xl font-black">{fact.value}</p>
              <p className="mt-2 text-sm font-bold text-muted-foreground">{fact.label}</p>
            </div>
          ))}
        </AppReveal>

        <div className="mt-16 grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <AppReveal>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-600">How we work</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Useful technology, backed by accountable people.</h2>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">The public catalog reads from the same project and inventory system used by the operational team. Enquiries enter the CRM with attribution and activity history, reducing handoff gaps.</p>
          </AppReveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {publicContent.about.principles.map((item, index) => {
              const Icon = principleIcons[item.icon];
              return (
                <AppReveal key={item.title} delay={index * 0.06} className="border border-border bg-background p-6 shadow-sm">
                  <Icon className="size-6 text-blue-600" />
                  <h3 className="mt-5 text-lg font-black">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                </AppReveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/50">
        <AppReveal className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div><h2 className="text-2xl font-black">Ready to build your shortlist?</h2><p className="mt-2 text-sm text-muted-foreground">Browse published projects or talk to the team about your requirements.</p></div>
          <Link href="/projects" className="inline-flex h-12 items-center justify-center gap-2 bg-blue-600 px-6 text-sm font-black text-white transition hover:bg-blue-700">Explore projects <ArrowRight className="size-4" /></Link>
        </AppReveal>
      </section>
    </div>
  );
}
