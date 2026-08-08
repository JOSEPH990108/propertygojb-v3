"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

import {
  captureMarketingAttribution,
  trackMarketingPageView,
} from "@/lib/public/analytics";
import { useMarketingConsent } from "@/lib/public/use-marketing-consent";

type MarketingScriptsProps = {
  googleAnalyticsId?: string;
  googleAdsId?: string;
  googleAdsConversionLabel?: string;
  metaPixelId?: string;
  tiktokPixelId?: string;
};

function MarketingPageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const currentPath = search ? `${pathname}?${search}` : pathname;
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    if (previousPath.current === null) {
      previousPath.current = currentPath;
      captureMarketingAttribution();
      return;
    }

    if (previousPath.current === currentPath) {
      return;
    }

    previousPath.current = currentPath;
    trackMarketingPageView(currentPath);
  }, [currentPath]);

  return null;
}

export function MarketingScripts({
  googleAnalyticsId,
  googleAdsId,
  googleAdsConversionLabel,
  metaPixelId,
  tiktokPixelId,
}: MarketingScriptsProps) {
  const consent = useMarketingConsent();
  const googleId = googleAnalyticsId ?? googleAdsId;

  if (consent !== "granted") {
    return null;
  }

  return (
    <>
      <Suspense fallback={null}>
        <MarketingPageViews />
      </Suspense>
      {googleId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${googleId}`} />
          <Script id="propertygojb-google-tags">
            {`window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());${googleAnalyticsId ? `gtag('config','${googleAnalyticsId}');` : ""}${googleAdsId ? `gtag('config','${googleAdsId}');` : ""}${googleAdsId && googleAdsConversionLabel ? `window.propertyGoJbGoogleAdsConversionTarget='${googleAdsId}/${googleAdsConversionLabel}';` : ""}`}
          </Script>
        </>
      ) : null}

      {metaPixelId ? (
        <Script id="propertygojb-meta-pixel">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}
        </Script>
      ) : null}

      {tiktokPixelId ? (
        <Script id="propertygojb-tiktok-pixel">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie','holdConsent','revokeConsent','grantConsent'];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e,n){var r='https://analytics.tiktok.com/i18n/pixel/events.js',o=n&&n.partner;ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};n=document.createElement('script');n.type='text/javascript';n.async=!0;n.src=r+'?sdkid='+e+'&lib='+t;e=document.getElementsByTagName('script')[0];e.parentNode.insertBefore(n,e)};ttq.load('${tiktokPixelId}');ttq.page()}(window,document,'ttq');`}
        </Script>
      ) : null}
    </>
  );
}
