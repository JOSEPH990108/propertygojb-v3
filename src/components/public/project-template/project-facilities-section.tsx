export type ProjectFacilityItem = {
  id: string;
  name: string;
};

type ProjectFacilitiesSectionProps = {
  eyebrow: string;
  heading: string;
  accentHeading: string;
  facilities: ProjectFacilityItem[];
};

/** "Facilities" — dark band listing real amenities, numbered to match the reference layout. */
export function ProjectFacilitiesSection({
  eyebrow,
  heading,
  accentHeading,
  facilities,
}: ProjectFacilitiesSectionProps) {
  if (facilities.length === 0) {
    return null;
  }

  return (
    <section
      id="facilities"
      className="flex min-h-screen flex-col justify-center bg-public-hero px-4 py-24 text-public-hero-foreground sm:px-6 lg:px-8 lg:py-36"
    >
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.3em] text-public-hero-accent uppercase">
            {eyebrow}
          </p>
          <h2 className="mt-8 font-serif text-5xl leading-[0.9] tracking-tight sm:text-7xl">
            {heading}
            <br />
            <em className="text-public-hero-accent not-italic">
              {accentHeading}
            </em>
          </h2>
        </div>

        <div className="grid gap-4 self-end sm:grid-cols-2">
          {facilities.map((facility, index) => (
            <div
              key={facility.id}
              className="border-t border-public-hero-foreground/20 pt-5"
            >
              <span className="font-serif text-2xl">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-8 text-sm text-public-hero-foreground/65">
                {facility.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
