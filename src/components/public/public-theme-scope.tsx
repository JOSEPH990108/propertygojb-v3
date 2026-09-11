"use client";

import { useLayoutEffect } from "react";

/**
 * Marks `<body>` with the public warm-ivory/charcoal token scope (see
 * `src/app/globals.css`) while a public route is mounted, and removes it on
 * unmount so admin/agent keep their neutral tokens. Runs in a layout effect
 * (before paint) so client-side navigation between surfaces never flashes the
 * wrong scope. Pair with the `InlineScript` rendered in
 * `src/app/(public)/layout.tsx` for hard navigations/reloads, where this
 * effect can't run until hydration.
 */
export function PublicThemeScope() {
  useLayoutEffect(() => {
    document.body.setAttribute("data-ui", "public");
    return () => {
      document.body.removeAttribute("data-ui");
    };
  }, []);

  return null;
}
