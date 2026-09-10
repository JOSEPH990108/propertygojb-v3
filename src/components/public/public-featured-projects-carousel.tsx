"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { AppIconButton } from "@/components/common/app-icon-button";
import { PublicProjectCard } from "@/components/public/public-project-card";
import type { PublicProjectCard as PublicProjectCardData } from "@/lib/public/projects";

type PublicFeaturedProjectsCarouselProps = {
  projects: PublicProjectCardData[];
};

/**
 * Mobile: horizontal snap-scroll (peeking next card). Desktop: a static 3-up
 * row; prev/next controls only render once content actually overflows the
 * visible row, so 1–3 projects (today's data) never show controls or a
 * duplicated loop.
 */
export function PublicFeaturedProjectsCarousel({
  projects,
}: PublicFeaturedProjectsCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    function updateScrollState() {
      if (!el) return;
      setOverflowing(el.scrollWidth > el.clientWidth + 4);
      setCanScrollPrev(el.scrollLeft > 4);
      setCanScrollNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }

    updateScrollState();
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(el);
    el.addEventListener("scroll", updateScrollState, { passive: true });

    return () => {
      resizeObserver.disconnect();
      el.removeEventListener("scroll", updateScrollState);
    };
  }, [projects.length]);

  function scrollByCard(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;

    const card = el.firstElementChild as HTMLElement | null;
    const amount = card ? card.offsetWidth + 24 : el.clientWidth * 0.85;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    el.scrollBy({
      left: amount * direction,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollByCard(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollByCard(-1);
    }
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        role="region"
        aria-label="Featured projects"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-2 motion-safe:scroll-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:-mx-6 sm:px-6 lg:mx-0 lg:snap-none lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
      >
        {projects.map((project) => (
          <PublicProjectCard
            key={project.id}
            project={project}
            className="w-[85%] shrink-0 snap-start sm:w-[70%] lg:w-[calc((100%-3rem)/3)] lg:shrink"
          />
        ))}
      </div>

      {overflowing ? (
        <div className="mt-4 hidden justify-end gap-2 lg:flex">
          <AppIconButton
            icon={ChevronLeft}
            label="Scroll to previous projects"
            onClick={() => scrollByCard(-1)}
            disabled={!canScrollPrev}
            variant="outline"
          />
          <AppIconButton
            icon={ChevronRight}
            label="Scroll to next projects"
            onClick={() => scrollByCard(1)}
            disabled={!canScrollNext}
            variant="outline"
          />
        </div>
      ) : null}
    </div>
  );
}
