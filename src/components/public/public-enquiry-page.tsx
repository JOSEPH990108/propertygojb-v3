import { AppReveal } from "@/components/common/app-reveal";
import {
  PublicEnquiryForm,
  type PublicEnquiryProjectOption,
} from "@/components/public/public-enquiry-form";
import { cn } from "@/lib/utils";

type PublicEnquiryPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  callout: string;
  formTitle: string;
  formDescription: string;
  projectOptions: PublicEnquiryProjectOption[];
  submitLabel?: string;
  tone?: "slate" | "blue";
  viewingRequest?: boolean;
};

const toneClasses = {
  slate: {
    panel: "bg-slate-950 shadow-slate-950/10",
    eyebrow: "text-blue-100",
    description: "text-slate-300",
    callout: "border-white/10 bg-white/5 text-slate-200",
  },
  blue: {
    panel: "bg-blue-600 shadow-blue-600/20",
    eyebrow: "text-blue-100",
    description: "text-blue-50",
    callout: "border-white/15 bg-white/10 text-blue-50",
  },
} as const;

export function PublicEnquiryPage({
  eyebrow,
  title,
  description,
  callout,
  formTitle,
  formDescription,
  projectOptions,
  submitLabel,
  tone = "slate",
  viewingRequest = false,
}: PublicEnquiryPageProps) {
  const classes = toneClasses[tone];

  return (
    <div className="bg-muted/40 px-4 py-12 sm:px-6 lg:px-8">
      <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <AppReveal
          className={cn(
            "space-y-6 rounded-[2rem] p-8 text-white shadow-2xl",
            classes.panel,
          )}
        >
          <p className={cn("text-sm font-black uppercase tracking-[0.28em]", classes.eyebrow)}>
            {eyebrow}
          </p>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
          <p className={cn("text-sm leading-7 sm:text-base", classes.description)}>
            {description}
          </p>
          <div
            className={cn(
              "rounded-[1.75rem] border p-5 text-sm leading-7 backdrop-blur",
              classes.callout,
            )}
          >
            {callout}
          </div>
        </AppReveal>

        <AppReveal delay={0.1}>
          <PublicEnquiryForm
            projectOptions={projectOptions}
            introTitle={formTitle}
            introDescription={formDescription}
            submitLabel={submitLabel}
            viewingRequest={viewingRequest}
          />
        </AppReveal>
      </section>
    </div>
  );
}
