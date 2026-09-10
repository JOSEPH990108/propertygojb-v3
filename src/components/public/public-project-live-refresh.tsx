"use client";

import Ably from "ably";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const REFRESH_INTERVAL_MS = 60_000;
const REALTIME_ENABLED = process.env.NEXT_PUBLIC_ABLY_ENABLED === "true";

function isProjectDataPage(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/projects" ||
    pathname.startsWith("/projects/")
  );
}

export function PublicProjectLiveRefresh() {
  const pathname = usePathname();
  const router = useRouter();
  const versionRef = useRef<string | null>(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    if (!isProjectDataPage(pathname)) {
      return;
    }

    function refreshPublicProjectData() {
      if (isRefreshingRef.current) {
        return;
      }

      isRefreshingRef.current = true;
      router.refresh();
      window.setTimeout(() => {
        isRefreshingRef.current = false;
      }, 1_000);
    }

    const realtime = REALTIME_ENABLED
      ? new Ably.Realtime({ authUrl: "/api/public/realtime/token" })
      : null;
    const channel = realtime?.channels.get("public-projects");

    channel?.subscribe("project-updated", refreshPublicProjectData);

    async function checkForUpdate() {
      if (document.visibilityState !== "visible" || isRefreshingRef.current) {
        return;
      }

      try {
        const response = await fetch("/api/public/projects/version", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const { version } = (await response.json()) as { version?: string };

        if (!version) {
          return;
        }

        if (versionRef.current && versionRef.current !== version) {
          refreshPublicProjectData();
        }

        versionRef.current = version;
      } catch {
        // A failed background freshness check must not interrupt browsing.
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void checkForUpdate();
      }
    }

    void checkForUpdate();
    const interval = REALTIME_ENABLED
      ? null
      : window.setInterval(() => void checkForUpdate(), REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      channel?.unsubscribe("project-updated", refreshPublicProjectData);
      realtime?.close();
    };
  }, [pathname, router]);

  return null;
}
