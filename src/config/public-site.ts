import { appConfig } from "./app";

export function marketingProviderId(
  value: string | undefined,
  pattern: RegExp,
) {
  const normalized = value?.trim();
  return normalized && pattern.test(normalized) ? normalized : undefined;
}

export const publicSiteConfig = {
  name: appConfig.name,
  shortName: appConfig.name,
  description:
    "Discover verified new launch properties, compare layouts, and connect with a Johor Bahru property specialist.",
  locale: "en_MY",
  language: "en",
  market: "Johor Bahru, Johor, Malaysia",
  url: appConfig.url.replace(/\/$/, ""),
  contact: {
    whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "60104608699",
  },
  marketing: {
    googleAnalyticsId: marketingProviderId(process.env.NEXT_PUBLIC_GA_ID, /^G-[A-Z0-9]+$/i),
    googleAdsId: marketingProviderId(process.env.NEXT_PUBLIC_GOOGLE_ADS_ID, /^AW-\d+$/i),
    googleAdsConversionLabel: marketingProviderId(
      process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL,
      /^[A-Za-z0-9_-]+$/,
    ),
    metaPixelId: marketingProviderId(process.env.NEXT_PUBLIC_META_PIXEL_ID, /^\d+$/),
    tiktokPixelId: marketingProviderId(process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID, /^[A-Za-z0-9]+$/),
  },
} as const;

export function getPublicUrl(path = "/") {
  return new URL(path, `${publicSiteConfig.url}/`).toString();
}
