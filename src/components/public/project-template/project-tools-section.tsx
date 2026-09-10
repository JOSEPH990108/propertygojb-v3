import { PublicLoanCalculator } from "@/components/public/public-loan-calculator";

type ProjectToolsSectionProps = {
  eyebrow: string;
  layouts: Parameters<typeof PublicLoanCalculator>[0]["layouts"];
  isAuthenticated: boolean;
};

/** "Planning tools" — reuses the existing real `PublicLoanCalculator`, framed to match the template. */
export function ProjectToolsSection({
  eyebrow,
  layouts,
  isAuthenticated,
}: ProjectToolsSectionProps) {
  return (
    <section
      id="tools"
      className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-24 text-foreground sm:px-6 lg:px-8 lg:py-36"
    >
      <p className="text-[10px] font-semibold tracking-[0.3em] text-public-decorative uppercase">
        {eyebrow}
      </p>
      <div className="mt-8 grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <h2 className="font-serif text-5xl leading-[0.9] tracking-tight sm:text-7xl">
          Make the
          <br />
          <em className="text-public-decorative not-italic">next move.</em>
        </h2>
        {/* No extra border/padding wrapper: `PublicLoanCalculator` already renders
            its own bordered card, so framing it again just double-boxed it. */}
        <PublicLoanCalculator
          layouts={layouts}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </section>
  );
}
