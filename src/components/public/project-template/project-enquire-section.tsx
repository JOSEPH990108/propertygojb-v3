import { ArrowRight, MessageCircle } from "lucide-react";

import { PublicEnquiryForm } from "@/components/public/public-enquiry-form";

type ProjectEnquireSectionProps = {
  eyebrow: string;
  projectId: string;
  projectName: string;
  whatsappHref: string;
};

/** "Enquire" — the reference's dark CTA band, carrying the real, functional enquiry form (not a decorative button). */
export function ProjectEnquireSection({
  eyebrow,
  projectId,
  projectName,
  whatsappHref,
}: ProjectEnquireSectionProps) {
  return (
    <section
      id="enquire"
      className="flex min-h-screen flex-col justify-center bg-public-hero px-4 py-24 text-public-hero-foreground sm:px-6 lg:px-8 lg:py-36"
    >
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.3em] text-public-hero-accent uppercase">
            {eyebrow}
          </p>
          <h2 className="mt-8 font-serif text-5xl leading-[0.9] tracking-tight sm:text-7xl">
            Your next
            <br />
            <em className="text-public-hero-accent not-italic">
              chapter begins here.
            </em>
          </h2>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="mt-10 inline-flex items-center gap-4 border border-public-hero-accent px-6 py-4 text-[10px] tracking-[0.2em] text-public-hero-accent uppercase transition hover:bg-public-hero-accent hover:text-public-hero"
          >
            <MessageCircle className="size-4" />
            WhatsApp us now
            <ArrowRight className="size-4" />
          </a>
        </div>

        {/* No extra colored wrapper: `PublicEnquiryForm` already renders its own
            themed `bg-card`/`border-border` panel, which correctly follows the
            site's light/dark preference — boxing it in the template's fixed
            cream palette double-framed the card and clashed in dark mode. */}
        <PublicEnquiryForm
          projectId={projectId}
          projectName={projectName}
          introTitle="Register your interest"
          introDescription="Share your details and we will contact you with the latest availability, brochure, and pricing."
        />
      </div>
    </section>
  );
}
