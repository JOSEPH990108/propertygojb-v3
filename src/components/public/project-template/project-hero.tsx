import type { ReactNode } from "react";
import Image from "next/image";
import { ArrowDown } from "lucide-react";

export type ProjectHeroMedia =
  | { type: "video"; videoUrl: string; posterUrl?: string | null }
  | { type: "image"; imageUrl: string; alt: string; isFallback?: boolean };

type ProjectHeroProps = {
  eyebrow: string;
  /** Structured so the template's default two-line/italic-accent treatment stays consistent across projects. */
  title: ReactNode;
  description: string;
  media: ProjectHeroMedia;
  /** Section id the scroll-down button jumps to (usually the first directory item). */
  scrollTargetId: string;
};

/**
 * Full-bleed dynamic hero for the "v1" project template — takes either a
 * project's own hero video, its own photo, or a labeled illustrative
 * fallback photo. Always dark regardless of the site's light/dark toggle,
 * reusing the existing `public-hero-*` fixed-palette tokens (same pattern as
 * the homepage hero) rather than inventing separate hex values.
 */
export function ProjectHero({
  eyebrow,
  title,
  description,
  media,
  scrollTargetId,
}: ProjectHeroProps) {
  return (
    <section
      id="overview"
      className="relative flex min-h-screen items-end overflow-hidden bg-public-hero pt-20 text-public-hero-foreground"
    >
      {media.type === "video" ? (
        <video
          src={media.videoUrl}
          poster={media.posterUrl ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 size-full object-cover opacity-75"
        />
      ) : (
        <Image
          src={media.imageUrl}
          alt={media.alt}
          fill
          unoptimized
          preload
          sizes="100vw"
          className="object-cover opacity-75"
        />
      )}

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-public-hero via-public-hero/45 to-transparent"
      />

      {media.type === "image" && media.isFallback ? (
        <span className="absolute right-4 bottom-4 text-[0.65rem] font-medium tracking-wide text-public-hero-foreground/70 uppercase">
          Illustrative photo
        </span>
      ) : null}

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <p className="text-[10px] font-semibold tracking-[0.35em] text-public-hero-accent uppercase">
          {eyebrow}
        </p>

        <h1 className="mt-7 max-w-3xl font-serif text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.95] tracking-tight">
          {title}
        </h1>

        <div className="mt-12 flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <p className="max-w-md text-sm leading-7 text-public-hero-foreground/70">
            {description}
          </p>

          <a
            href={`#${scrollTargetId}`}
            aria-label="Scroll to project details"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-public-hero-foreground/35 transition hover:bg-public-hero-accent hover:text-public-hero"
          >
            <ArrowDown className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
