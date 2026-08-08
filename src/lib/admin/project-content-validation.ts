import { z } from "zod";

function optionalHttpsUrl(label: string, allowedExtensions?: readonly string[]) {
  return z
    .string()
    .trim()
    .max(1000)
    .transform((value) => value || null)
    .refine((value) => {
      if (!value) return true;

      try {
        const url = new URL(value);

        if (url.protocol !== "https:") return false;
        if (!allowedExtensions) return true;

        const path = url.pathname.toLowerCase();
        return allowedExtensions.some((extension) => path.endsWith(extension));
      } catch {
        return false;
      }
    }, `${label} must be a valid HTTPS URL${allowedExtensions ? ` ending in ${allowedExtensions.join(", ")}` : ""}.`);
}

export const canonicalUrlSchema = optionalHttpsUrl("Canonical URL");
export const heroVideoUrlSchema = optionalHttpsUrl("Hero video URL", [
  ".mp4",
  ".webm",
]);
export const externalImageUrlSchema = optionalHttpsUrl("Image URL", [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
]);

export const publishScheduleSchema = z.object({
  isPublished: z.boolean(),
  publishedAt: z
    .string()
    .trim()
    .nullable()
    .transform((value) => value || null)
    .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
      message: "Choose a valid publication date and time.",
    }),
});

export function isProjectPubliclyVisible(
  isPublished: boolean,
  publishedAt: Date | null,
  now = new Date(),
) {
  return isPublished && (!publishedAt || publishedAt.getTime() <= now.getTime());
}