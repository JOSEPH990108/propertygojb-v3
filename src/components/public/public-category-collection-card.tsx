import Image from "next/image";
import Link from "next/link";
import { Building2 } from "lucide-react";

type PublicCategoryCollectionCardProps = {
  index: string;
  categoryName: string;
  projectCount: number;
  availableUnitCount: number;
  description: string;
  imageUrl: string | null;
  imageAlt: string;
  href: string;
};

/** Editorial split card for a property category (e.g. High Rise vs Landed), used in the homepage "collections" section. */
export function PublicCategoryCollectionCard({
  index,
  categoryName,
  projectCount,
  availableUnitCount,
  description,
  imageUrl,
  imageAlt,
  href,
}: PublicCategoryCollectionCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-none bg-card">
      <div className="relative aspect-3/2 overflow-hidden sm:aspect-4/3 lg:aspect-4/5">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            unoptimized
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover transition duration-700 motion-safe:group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-public-hero">
            <Building2 className="size-14 text-public-hero-foreground/30" />
          </div>
        )}

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-public-hero/90 via-public-hero/20 to-transparent"
        />

        <span
          aria-hidden="true"
          className="absolute top-6 left-6 font-serif text-2xl italic text-public-hero-foreground/70"
        >
          {index}
        </span>

        <div className="absolute inset-x-0 bottom-0 p-8 lg:p-10">
          <p className="mb-3 text-[0.65rem] font-medium tracking-[0.3em] text-public-hero-accent uppercase">
            {projectCount} {projectCount === 1 ? "project" : "projects"} ·{" "}
            {availableUnitCount} available units
          </p>
          <h3 className="font-serif text-4xl font-light text-public-hero-foreground lg:text-5xl">
            {categoryName}
          </h3>
          <p className="mt-4 max-w-md text-pretty text-sm leading-relaxed font-light text-public-hero-foreground/85">
            {description}
          </p>
          <Link
            href={href}
            className="mt-6 inline-flex items-center gap-3 text-xs font-light tracking-[0.22em] text-public-hero-foreground uppercase"
          >
            Explore
            <span
              aria-hidden="true"
              className="h-px w-8 bg-public-hero-accent transition-all duration-300 group-hover:w-12"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
