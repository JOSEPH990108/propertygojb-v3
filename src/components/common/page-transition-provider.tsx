"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

function getDestinationName(pathname: string) {
  if (pathname === "/") {
    return "Home";
  }

  const segment = pathname.split("/").filter(Boolean).at(-1);

  return segment ? segment.replace(/-/g, " ") : "PropertyGoJB";
}

export function PageTransitionProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const previousPathname = useRef(pathname);
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [destination, setDestination] = useState(getDestinationName(pathname));
  const [progress, setProgress] = useState(0);

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

      event.preventDefault();
      setDestination(getDestinationName(url.pathname));
      setProgress(12);
      setIsLeaving(false);
      setIsVisible(true);
      router.push(`${url.pathname}${url.search}${url.hash}`);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname, router]);

  useEffect(() => {
    if (previousPathname.current === pathname) {
      return;
    }

    previousPathname.current = pathname;
    setDestination(getDestinationName(pathname));
    setProgress(100);
    setIsLeaving(true);

    const timer = window.setTimeout(() => setIsVisible(false), 220);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const timer = window.setInterval(() => {
      setProgress((currentProgress) =>
        Math.min(currentProgress + (currentProgress < 72 ? 3 : 0.4), 92),
      );
    }, 70);

    return () => window.clearInterval(timer);
  }, [isVisible]);

  return (
    <>
      {children}
      <div
        aria-hidden={!isVisible}
        aria-live="polite"
        className={`fixed inset-0 z-[60] flex flex-col justify-between bg-foreground px-6 py-8 text-background transition-opacity duration-200 motion-reduce:transition-none sm:px-10 sm:py-10 ${isVisible ? "opacity-100" : "pointer-events-none opacity-0"} ${isLeaving ? "scale-[0.99]" : "scale-100"}`}
        role="status"
      >
        <p className="text-xs font-medium tracking-[0.16em]">PROPERTYGOJB</p>
        <div className="text-center">
          <p className="text-sm text-background/60">Opening</p>
          <p className="mt-2 text-2xl font-medium capitalize sm:text-3xl">
            {destination}
          </p>
        </div>
        <div>
          <div className="h-px bg-background/25">
            <span
              className="block h-full bg-background transition-[width] duration-100 motion-reduce:transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-3 text-right text-xs text-background/60">
            {Math.round(progress)}%
          </p>
        </div>
      </div>
    </>
  );
}