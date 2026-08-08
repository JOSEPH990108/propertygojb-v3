import type { Metadata, MetadataRoute } from "next";

import { getPublicUrl, publicSiteConfig } from "../../config/public-site";

type PublicPageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  canonicalUrl?: string;
  socialTitle?: string;
  socialDescription?: string;
  images?: { url: string }[];
};

function isValidSocialImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || (url.protocol === "http:" && url.hostname === "localhost");
  } catch {
    return false;
  }
}

export function buildPublicPageMetadata({
  title,
  description,
  path,
  canonicalUrl,
  socialTitle = `${title} | ${publicSiteConfig.name}`,
  socialDescription = description,
  images,
}: PublicPageMetadataOptions): Metadata {
  const canonical = canonicalUrl ?? getPublicUrl(path);
  const validImages = images?.filter((image) => isValidSocialImageUrl(image.url));
  const socialImages = validImages?.length ? validImages : [
    {
      url: getPublicUrl("/social-image"),
      width: 1200,
      height: 630,
      alt: `${publicSiteConfig.name} - Johor Bahru property discovery`,
    },
  ];

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: socialTitle,
      description: socialDescription,
      siteName: publicSiteConfig.name,
      type: "website",
      locale: publicSiteConfig.locale,
      url: canonical,
      images: socialImages,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: socialDescription,
      images: socialImages,
    },
  };
}

export function getPublicRobotsMetadata(isProduction: boolean): Metadata["robots"] {
  return isProduction
    ? { index: true, follow: true }
    : { index: false, follow: false, noarchive: true, nocache: true };
}

export function getPublicRobotsFile(isProduction: boolean): MetadataRoute.Robots {
  if (!isProduction) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/agent/", "/account/", "/api/", "/auth-redirect"],
    },
    sitemap: getPublicUrl("/sitemap.xml"),
    host: publicSiteConfig.url,
  };
}