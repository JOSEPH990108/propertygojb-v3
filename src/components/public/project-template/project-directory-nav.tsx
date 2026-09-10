"use client";

import { useEffect, useState } from "react";
import { ChevronDown, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type ProjectDirectoryItem = {
  id: string;
  label: string;
  group: string;
};

type ProjectDirectoryNavProps = {
  items: ProjectDirectoryItem[];
  /** Display order for groups; a group with no items is omitted automatically. */
  groupOrder: string[];
  className?: string;
};

/**
 * Grouped, scroll-tracked in-page directory for the "v1" project template.
 * Only sections a project actually has content for are passed in, so both
 * the flat item list and the group headers are fully dynamic per project.
 * Uses a plain scroll listener (not IntersectionObserver) so a tall aside or
 * sticky panel elsewhere on the page can never dominate the "active" state.
 */
export function ProjectDirectoryNav({
  items,
  groupOrder,
  className,
}: ProjectDirectoryNavProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    function update() {
      const marker = window.scrollY + 220;
      let current = items[0]?.id ?? null;

      for (const item of items) {
        const section = document.getElementById(item.id);

        if (section && section.offsetTop <= marker) {
          current = item.id;
        }
      }

      setActiveId(current);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  const groups = groupOrder
    .map((group) => ({
      group,
      groupItems: items.filter((item) => item.group === group),
    }))
    .filter((group) => group.groupItems.length > 0);

  const activeLabel = items.find((item) => item.id === activeId)?.label;

  function jump(id: string) {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  }

  return (
    <div
      className={cn(
        "sticky top-20 z-30 border-b border-border bg-background/95 px-4 shadow-sm backdrop-blur-xl sm:px-6 lg:px-8",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between py-4 text-[10px] font-semibold tracking-[0.22em] text-foreground uppercase md:hidden"
      >
        Project directory
        <span className="inline-flex items-center text-public-decorative">
          {activeLabel}
          {open ? (
            <X className="ml-2 size-4" />
          ) : (
            <ChevronDown className="ml-2 size-4" />
          )}
        </span>
      </button>

      <nav
        aria-label="Project sections"
        className={cn(
          "mx-auto max-w-7xl flex-col gap-5 border-t border-border py-5 md:flex md:flex-row md:items-center md:justify-between md:border-0 md:py-4",
          open ? "flex" : "hidden md:flex",
        )}
      >
        {groups.map(({ group, groupItems }) => (
          <div
            key={group}
            className="flex flex-wrap items-center gap-x-4 gap-y-3"
          >
            <span className="mr-1 text-[9px] font-semibold tracking-[0.22em] text-public-decorative uppercase">
              {group}
            </span>
            {groupItems.map((item) => {
              const active = item.id === activeId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => jump(item.id)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "text-xs transition-colors",
                    active
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}
