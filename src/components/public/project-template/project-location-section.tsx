import { MapPin } from "lucide-react";

export type ProjectNearbyPlace = {
  id: string;
  name: string;
  distanceLabel: string;
};

type ProjectLocationSectionProps = {
  eyebrow: string;
  heading: string;
  accentHeading: string;
  description: string;
  places: ProjectNearbyPlace[];
  pinLabel: string;
  regionLabel: string;
};

/** "Location" — real nearby-place distances beside a decorative pinned map graphic. */
export function ProjectLocationSection({
  eyebrow,
  heading,
  accentHeading,
  description,
  places,
  pinLabel,
  regionLabel,
}: ProjectLocationSectionProps) {
  return (
    <section
      id="location"
      // Clears the fixed header + sticky directory nav on jump-to-section, unlike its shorter own padding.
      className="grid min-h-screen scroll-mt-36 bg-muted text-foreground md:grid-cols-2"
    >
      <div className="flex flex-col justify-center p-6 sm:p-12 lg:p-20">
        <p className="text-[10px] font-semibold tracking-[0.3em] text-public-decorative uppercase">
          {eyebrow}
        </p>
        <h2 className="mt-8 font-serif text-5xl leading-[0.9] tracking-tight sm:text-7xl">
          {heading}
          <br />
          <em className="text-public-decorative not-italic">{accentHeading}</em>
        </h2>
        <p className="mt-12 max-w-md text-sm leading-7 text-muted-foreground">
          {description}
        </p>

        {places.length > 0 ? (
          <div className="mt-12 space-y-4 text-xs">
            {places.map((place) => (
              <div
                key={place.id}
                className="flex justify-between border-b border-border pb-3"
              >
                <span>{place.name}</span>
                <span>{place.distanceLabel}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative min-h-[420px] overflow-hidden bg-public-hero">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(214,180,119,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(214,180,119,.25) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="absolute top-1/2 left-1/2 size-4 rounded-full bg-public-hero-accent shadow-[0_0_0_16px_rgba(214,180,119,.2)]" />
        <span className="absolute top-[44%] left-[53%] text-[9px] tracking-[0.24em] text-public-hero-foreground uppercase">
          {pinLabel}
        </span>
        <MapPin className="absolute bottom-8 left-8 size-4 text-public-hero-accent" />
        <span className="absolute bottom-8 left-14 text-[9px] tracking-[0.2em] text-public-hero-foreground/55 uppercase">
          {regionLabel}
        </span>
      </div>
    </section>
  );
}
