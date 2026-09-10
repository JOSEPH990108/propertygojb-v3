export const MARKETING_CONSENT_KEY = "propertygojb-marketing-consent";
export const MARKETING_CONSENT_EVENT = "propertygojb:marketing-consent";
export const MARKETING_ATTRIBUTION_KEY = "propertygojb-marketing-attribution";

export type MarketingConsent = "granted" | "denied";

export type MarketingAttribution = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
  clickId: string | null;
  referrer: string | null;
  landingPath: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    propertyGoJbGoogleAdsConversionTarget?: string;
    fbq?: (...args: unknown[]) => void;
    ttq?: {
      page?: () => void;
      track?: (eventName: string, parameters?: Record<string, unknown>) => void;
      revokeConsent?: () => void;
    };
  }
}

export function getStoredMarketingConsent(): MarketingConsent | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(MARKETING_CONSENT_KEY);
  return value === "granted" || value === "denied" ? value : null;
}

export function storeMarketingConsent(consent: MarketingConsent) {
  window.localStorage.setItem(MARKETING_CONSENT_KEY, consent);

  if (consent === "granted") {
    captureMarketingAttribution();
  } else {
    window.gtag?.("consent", "update", {
      ad_storage: "denied",
      analytics_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.fbq?.("consent", "revoke");
    window.ttq?.revokeConsent?.();
  }

  window.dispatchEvent(new CustomEvent(MARKETING_CONSENT_EVENT, { detail: consent }));
}

function getCurrentMarketingAttribution(): MarketingAttribution {
  const params = new URLSearchParams(window.location.search);

  return {
    source: params.get("utm_source"),
    medium: params.get("utm_medium"),
    campaign: params.get("utm_campaign"),
    content: params.get("utm_content"),
    term: params.get("utm_term"),
    clickId: params.get("gclid") ?? params.get("fbclid") ?? params.get("ttclid"),
    referrer: document.referrer || null,
    landingPath: `${window.location.pathname}${window.location.search}`,
  };
}

function getStoredMarketingAttribution(): MarketingAttribution | null {
  try {
    const value = window.sessionStorage.getItem(MARKETING_ATTRIBUTION_KEY);
    if (!value) return null;

    const parsed = JSON.parse(value) as Partial<MarketingAttribution>;
    return typeof parsed.landingPath === "string"
      ? { ...getCurrentMarketingAttribution(), ...parsed }
      : null;
  } catch {
    return null;
  }
}

export function captureMarketingAttribution() {
  const stored = getStoredMarketingAttribution();
  if (stored) return stored;

  const attribution = getCurrentMarketingAttribution();

  try {
    window.sessionStorage.setItem(
      MARKETING_ATTRIBUTION_KEY,
      JSON.stringify(attribution),
    );
  } catch {
    // Submission can still use the current page when storage is unavailable.
  }

  return attribution;
}

export function getMarketingAttribution(): MarketingAttribution {
  if (getStoredMarketingConsent() !== "granted") {
    return {
      source: null,
      medium: null,
      campaign: null,
      content: null,
      term: null,
      clickId: null,
      referrer: null,
      landingPath: window.location.pathname,
    };
  }

  return getStoredMarketingAttribution() ?? getCurrentMarketingAttribution();
}

/** Sends one normalized event to every configured provider after consent. */
export function trackMarketingEvent(
  eventName: string,
  parameters: Record<string, unknown> = {},
) {
  if (getStoredMarketingConsent() !== "granted") {
    return;
  }

  window.gtag?.("event", eventName, parameters);

  if (eventName === "generate_lead") {
    if (window.propertyGoJbGoogleAdsConversionTarget) {
      window.gtag?.("event", "conversion", {
        ...parameters,
        send_to: window.propertyGoJbGoogleAdsConversionTarget,
      });
    }
    window.fbq?.("track", "Lead", parameters);
    window.ttq?.track?.("SubmitForm", parameters);
    return;
  }

  window.fbq?.("trackCustom", eventName, parameters);
  window.ttq?.track?.(eventName, parameters);
}

export function trackMarketingPageView(path: string) {
  if (getStoredMarketingConsent() !== "granted") {
    return;
  }

  window.gtag?.("event", "page_view", { page_path: path });
  window.fbq?.("track", "PageView");
  window.ttq?.page?.();
}
