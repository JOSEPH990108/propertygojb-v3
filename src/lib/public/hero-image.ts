import "server-only";

import fs from "node:fs";
import path from "node:path";

const HERO_DIR = path.join(process.cwd(), "public", "images", "hero");
const HERO_BASENAME = "homepage-hero";

// Order also acts as the tie-break if more than one variant is ever present.
const HERO_EXTENSIONS = ["jpg", "jpeg", "png", "svg"] as const;

/** Resolves whichever homepage-hero.{jpg,jpeg,png,svg} file is present in public/images/hero. */
export function getPublicHeroImage() {
  for (const extension of HERO_EXTENSIONS) {
    const filePath = path.join(HERO_DIR, `${HERO_BASENAME}.${extension}`);
    if (fs.existsSync(filePath)) {
      return {
        src: `/images/hero/${HERO_BASENAME}.${extension}`,
        // SVGs are not passed through Next's image optimizer for security reasons.
        unoptimized: extension === "svg",
      };
    }
  }

  return { src: `/images/hero/${HERO_BASENAME}.jpg`, unoptimized: false };
}
