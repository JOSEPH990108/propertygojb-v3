import { ExpandableImage } from "@/components/common/expandable-image";

export type ProjectGalleryPhoto = {
  id: string;
  url: string;
  alt: string;
  caption: string;
  isFallback: boolean;
};

type ProjectGallerySectionProps = {
  eyebrow: string;
  photos: ProjectGalleryPhoto[];
};

/** "Gallery" — the reference's asymmetric two-photo duo, real photos first, illustrative fallback otherwise. */
export function ProjectGallerySection({
  eyebrow,
  photos,
}: ProjectGallerySectionProps) {
  if (photos.length === 0) {
    return null;
  }

  return (
    <section
      id="gallery"
      className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-24 sm:px-6 lg:px-8 lg:py-36"
    >
      <p className="text-[10px] font-semibold tracking-[0.3em] text-public-decorative uppercase">
        {eyebrow}
      </p>
      <div className="mt-8 grid gap-5 sm:grid-cols-[1.4fr_0.6fr]">
        {photos.map((photo, index) => (
          <ExpandableImage
            key={photo.id}
            src={photo.url}
            alt={photo.alt}
            className="group relative block min-h-[420px] cursor-zoom-in overflow-hidden text-left"
            imgClassName="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-public-hero/70 to-transparent"
            />
            <span className="pointer-events-none absolute bottom-6 left-6 text-[10px] tracking-[0.25em] text-public-hero-foreground uppercase">
              {String(index + 1).padStart(2, "0")} / {photo.caption}
              {photo.isFallback ? " (illustrative)" : ""}
            </span>
          </ExpandableImage>
        ))}
      </div>
    </section>
  );
}
