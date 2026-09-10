"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";

type ExpandableImageProps = {
  src: string;
  alt: string;
  /** Wraps the thumbnail; caller controls the thumbnail's size/aspect (e.g. `absolute inset-0`). */
  className?: string;
  imgClassName?: string;
  /** Decorative overlay content (gradient/caption) painted over the thumbnail only, not the expanded view. */
  children?: ReactNode;
};

/**
 * A thumbnail that expands into a larger, centered image viewer on click,
 * with a Motion shared-layout transition from the small to the big image.
 * Reused across the project template's gallery, floor-plan, and site-plan
 * images (see `docs/UI_DESIGN_GUIDE.md` \u00a79 for the reduced-motion pattern).
 */
export function ExpandableImage({
  src,
  alt,
  className,
  imgClassName,
  children,
}: ExpandableImageProps) {
  const [open, setOpen] = useState(false);
  const layoutId = useId();
  const reduceMotion = useReducedMotion();
  const sharedLayoutId = reduceMotion ? undefined : layoutId;

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Expand image: ${alt}`}
        className={className}
      >
        <motion.img
          layoutId={sharedLayoutId}
          src={src}
          alt={alt}
          className={imgClassName}
        />
        {children}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={alt}
            className="fixed inset-0 z-100 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          >
            <motion.img
              layoutId={sharedLayoutId}
              src={src}
              alt={alt}
              className="max-h-[88vh] max-w-full object-contain shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            />

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close image viewer"
              className="absolute top-4 right-4 grid size-11 place-items-center rounded-full bg-foreground text-background transition hover:brightness-110"
            >
              <X className="size-5" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
