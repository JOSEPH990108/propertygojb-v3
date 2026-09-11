"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function PageTransitionProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as HTMLElement).closest("a");
      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute("href");

      if (
        !href ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      const url = new URL(href, window.location.href);

      if (url.origin !== window.location.origin || url.pathname === pathname) {
        return;
      }

      setIsLeaving(false);
      setIsVisible(true);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  useEffect(() => {
    if (previousPathname.current === pathname) {
      return;
    }

    previousPathname.current = pathname;
    setIsLeaving(true);

    const timer = window.setTimeout(() => setIsVisible(false), 750);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      {children}
      <div
        aria-hidden={!isVisible}
        aria-live="polite"
        className={`fixed inset-0 z-[60] overflow-hidden transition-opacity duration-150 motion-reduce:transition-none ${isVisible ? "opacity-100" : "pointer-events-none opacity-0"}`}
        role="status"
      >
        <div
          className={`absolute inset-y-0 left-0 w-1/2 bg-public-hero text-public-hero-foreground transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] motion-reduce:transition-none ${isLeaving ? "-translate-x-full" : "translate-x-0"}`}
        >
          <span className="absolute top-1/2 right-0 -translate-y-1/2 font-serif text-5xl leading-none sm:text-7xl lg:text-9xl">
            PROPER
          </span>
        </div>
        <div
          className={`absolute inset-y-0 right-0 w-1/2 bg-public-hero text-public-hero-foreground transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] motion-reduce:transition-none ${isLeaving ? "translate-x-full" : "translate-x-0"}`}
        >
          <span className="absolute top-1/2 -left-[0.06em] -translate-y-1/2 font-serif text-5xl leading-none sm:text-7xl lg:text-9xl">
            TYGOJB
          </span>
        </div>
        <span className="sr-only">Loading page</span>
      </div>
    </>
  );
}