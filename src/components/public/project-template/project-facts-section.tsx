import type { ReactNode } from "react";

export type ProjectFact = {
  label: string;
  value: ReactNode;
};

type ProjectFactsSectionProps = {
  eyebrow: string;
  heading: string;
  accentHeading: string;
  description: string;
  facts: ProjectFact[];
};

/** "The residence" section — heading + description + a real facts strip (homes/type/from/status). */
export function ProjectFactsSection({
  eyebrow,
  heading,
  accentHeading,
  description,
  facts,
}: ProjectFactsSectionProps) {
  return (
    <section
      id="residence"
      className="mx-auto grid min-h-screen max-w-7xl content-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-36"
    >
      <div>
        <p className="text-[10px] font-semibold tracking-[0.3em] text-public-decorative uppercase">
          {eyebrow}
        </p>
        <h2 className="mt-8 max-w-xl font-serif text-5xl leading-[0.9] tracking-tight sm:text-7xl">
          {heading}
          <br />
          <em className="text-public-decorative not-italic">{accentHeading}</em>
        </h2>
      </div>

      <div className="self-end">
        <p className="max-w-lg text-base leading-8 text-muted-foreground">
          {description}
        </p>

        {facts.length > 0 ? (
          <dl className="mt-12 grid grid-cols-2 gap-8 border-t border-border pt-6 text-xs sm:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-muted-foreground">{fact.label}</dt>
                <dd className="mt-2 font-serif text-2xl">{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}
