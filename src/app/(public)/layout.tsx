import type { Metadata } from "next";
import type { ReactNode } from "react";

import { publicSiteConfig } from "@/config/public-site";
import { isProduction } from "@/config/app";
import { InlineScript } from "@/components/common/inline-script";
import { MarketingConsentBanner } from "@/components/public/marketing-consent";
import { MarketingScripts } from "@/components/public/marketing-scripts";
import { PublicShell } from "@/components/public/public-shell";
import { PublicThemeScope } from "@/components/public/public-theme-scope";
import { StructuredData } from "@/components/public/structured-data";
import { PUBLIC_SITE_NAME, PUBLIC_SITE_TAGLINE } from "@/lib/public/site";
import { getPublicRobotsMetadata } from "@/lib/public/seo";

export const metadata: Metadata = {
  metadataBase: new URL(publicSiteConfig.url),
  title: {
    default: PUBLIC_SITE_NAME,
    template: `%s | ${PUBLIC_SITE_NAME}`,
  },
  description: PUBLIC_SITE_TAGLINE,
  applicationName: PUBLIC_SITE_NAME,
  category: "real estate",
  keywords: [
    "Johor Bahru property",
    "JB new launch",
    "Johor property",
    "Malaysia property",
    "new launch condominium",
  ],
  robots: getPublicRobotsMetadata(isProduction()),
  openGraph: {
    title: PUBLIC_SITE_NAME,
    description: PUBLIC_SITE_TAGLINE,
    siteName: PUBLIC_SITE_NAME,
    type: "website",
    locale: publicSiteConfig.locale,
    url: publicSiteConfig.url,
  },
  twitter: {
    card: "summary_large_image",
    title: PUBLIC_SITE_NAME,
    description: PUBLIC_SITE_TAGLINE,
  },
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: publicSiteConfig.name,
    url: publicSiteConfig.url,
    description: publicSiteConfig.description,
    areaServed: publicSiteConfig.market,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      telephone: `+${publicSiteConfig.contact.whatsappNumber}`,
      availableLanguage: ["English", "Malay", "Chinese"],
    },
  };

  return (
    <>
      {/* Hard navigation/reload: runs during HTML parsing, before first paint. */}
      <InlineScript html="document.body.setAttribute('data-ui','public')" />
      <PublicThemeScope />
      <StructuredData data={organizationSchema} />
      <PublicShell>{children}</PublicShell>
      <MarketingConsentBanner />
      <MarketingScripts {...publicSiteConfig.marketing} />
    </>
  );
}
