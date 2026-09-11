/**
 * Illustrative/sample media used by the reusable project-detail template
 * (`src/components/public/project-template/`) whenever a real project has
 * not yet uploaded its own photography. These are stock reference photos —
 * never presented as a specific project's actual unit/interior — and always
 * paired with an "Illustrative photo" label (see `PublicProjectCard`'s
 * existing pattern) so no fabricated project truth is implied.
 *
 * Source: `public/images/projects/vistara-hills/` — supplied reference photography.
 */

const VISTARA_BASE = "/images/projects/vistara-hills";

/** Public folder paths may contain spaces/`&`; encode each segment for a safe URL. */
function encodePublicPath(path: string) {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export const FALLBACK_HERO_IMAGE = encodePublicPath(
  `${VISTARA_BASE}/Vistara Hills Hero.jpg`,
);

export const FALLBACK_GALLERY_IMAGES = [
  encodePublicPath(`${VISTARA_BASE}/Vistara Hills Original.jpg`),
  encodePublicPath(`${VISTARA_BASE}/Vistara Hills Side Angel.jpg`),
].map((url) => ({ url, alt: "Illustrative exterior photo — sample content" }));

export const FALLBACK_SITE_PLAN_IMAGE = encodePublicPath(
  `${VISTARA_BASE}/Vistara Units Site Plan.jpg`,
);

export type FallbackLayoutGroup = {
  label: string;
  groundFloorImage: string;
  upperFloorImage: string;
};

/**
 * The Vistara sample assets are exactly 2 illustrative house designs, each
 * with 2 matching floor images (ground, first & second) — NOT 4 unrelated
 * single images. A layout with no real floor plan of its own is assigned one
 * whole group (never a lone image from one design mixed with another).
 */
export const FALLBACK_LAYOUT_GROUPS: FallbackLayoutGroup[] = [
  {
    label: "Corner & Intermediate",
    groundFloorImage: encodePublicPath(
      `${VISTARA_BASE}/Corner & Intermediate - Ground Floor.jpg`,
    ),
    upperFloorImage: encodePublicPath(
      `${VISTARA_BASE}/Corner & Intermediate - First and Second Floor.jpg`,
    ),
  },
  {
    label: "End & Intermediate",
    groundFloorImage: encodePublicPath(
      `${VISTARA_BASE}/End & Intermediate - Ground Floor.jpg`,
    ),
    upperFloorImage: encodePublicPath(
      `${VISTARA_BASE}/End & Intermediate - First and Second Floor.jpg`,
    ),
  },
];
