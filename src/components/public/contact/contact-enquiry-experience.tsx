"use client";

import { useState } from "react";
import { Compass, Home, MessageCircle, Sparkles } from "lucide-react";

import { AppReveal } from "@/components/common/app-reveal";
import { cn } from "@/lib/utils";

import {
  ContactEnquiryForm,
  type ContactEnquiryProjectOption,
} from "./contact-enquiry-form";
import { ContactPathSelector } from "./contact-path-selector";

export type ContactEnquiryPath = "KNOWN" | "DISCOVER";

type ContactEnquiryExperienceProps = {
  eyebrow: string;
  title: string;
  description: string;
  projects: ContactEnquiryProjectOption[];
  areaOptions: string[];
};

const PROCESS_STEPS = [
  "Tell us what you're looking for",
  "We shortlist suitable properties",
  "Chat with our property team on WhatsApp",
];

function ProcessSidebar() {
  return (
    <aside className="bg-muted p-6 text-muted-foreground sm:p-8">
      <p className="text-xs font-black tracking-[0.2em] text-public-decorative uppercase">
        A Simple Process
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">
        What happens next?
      </h2>

      <ol className="mt-6 space-y-4">
        {PROCESS_STEPS.map((step, index) => (
          <li
            key={step}
            className={cn(
              "border-t border-border pt-4 text-sm leading-6 font-semibold text-foreground",
              index === 0 && "border-t-0 pt-0",
            )}
          >
            <span className="mr-2 text-xs font-black text-public-decorative">
              {String(index + 1).padStart(2, "0")}
            </span>
            {step}
          </li>
        ))}
      </ol>

      <p className="mt-6 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Sparkles className="size-3.5 shrink-0 text-public-decorative" aria-hidden="true" />
        Personal guidance, no pressure.
      </p>
    </aside>
  );
}

export function ContactEnquiryExperience({
  eyebrow,
  title,
  description,
  projects,
  areaOptions,
}: ContactEnquiryExperienceProps) {
  const [path, setPath] = useState<ContactEnquiryPath>("KNOWN");

  return (
    <div className="bg-background px-4 pt-28 pb-16 sm:px-6 lg:px-8">
      <AppReveal className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-black tracking-[0.28em] text-public-decorative uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
          {description}
        </p>
      </AppReveal>

      <AppReveal delay={0.05} className="mx-auto mt-8 max-w-3xl">
        <ContactPathSelector
          path={path}
          onPathChange={setPath}
          options={[
            {
              value: "KNOWN",
              icon: <Home className="size-5" aria-hidden="true" />,
              title: "I know the project",
              description: "I already have a project in mind.",
            },
            {
              value: "DISCOVER",
              icon: <Compass className="size-5" aria-hidden="true" />,
              title: "Help me find a property",
              description: "Recommend properties based on what I'm looking for.",
            },
          ]}
        />
      </AppReveal>

      <div className="mx-auto mt-10 grid max-w-6xl gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <AppReveal delay={0.1}>
          <ContactEnquiryForm
            key={path}
            path={path}
            projects={projects}
            areaOptions={areaOptions}
          />
        </AppReveal>

        <AppReveal delay={0.15} className="lg:sticky lg:top-28">
          <ProcessSidebar />
        </AppReveal>
      </div>

      <p className="mx-auto mt-10 flex max-w-6xl items-center justify-center gap-2 text-xs text-muted-foreground">
        <MessageCircle className="size-3.5" aria-hidden="true" />
        Prefer to chat directly? Message us anytime on WhatsApp.
      </p>
    </div>
  );
}
