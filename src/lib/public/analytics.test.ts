import { afterEach, describe, expect, it, vi } from "vitest";

import {
  captureMarketingAttribution,
  getMarketingAttribution,
  getStoredMarketingConsent,
  storeMarketingConsent,
  trackMarketingEvent,
  trackMarketingPageView,
} from "./analytics";

function createBrowserState(consent: string | null = null) {
  const storage = new Map<string, string>();
  const sessionStorage = new Map<string, string>();
  if (consent) storage.set("propertygojb-marketing-consent", consent);

  const dispatchEvent = vi.fn();
  const fbq = vi.fn();
  const gtag = vi.fn();
  const track = vi.fn();
  const page = vi.fn();
  const revokeConsent = vi.fn();
  const dataLayer: unknown[] = [];

  vi.stubGlobal("window", {
    location: {
      search: "?utm_source=meta&utm_medium=paid&utm_campaign=launch&fbclid=click-1",
      pathname: "/projects/vistara-hill",
    },
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
    sessionStorage: {
      getItem: (key: string) => sessionStorage.get(key) ?? null,
      setItem: (key: string, value: string) => sessionStorage.set(key, value),
    },
    dispatchEvent,
    dataLayer,
    gtag,
    fbq,
    ttq: { track, page, revokeConsent },
  });
  vi.stubGlobal("document", { referrer: "https://www.google.com/" });

  return {
    storage,
    sessionStorage,
    dispatchEvent,
    dataLayer,
    gtag,
    fbq,
    track,
    page,
    revokeConsent,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("marketing consent", () => {
  it("stores and broadcasts an explicit choice", () => {
    const browser = createBrowserState();

    storeMarketingConsent("granted");

    expect(getStoredMarketingConsent()).toBe("granted");
    expect(browser.dispatchEvent).toHaveBeenCalledOnce();
  });

  it("revokes active provider consent when marketing is denied", () => {
    const browser = createBrowserState("granted");

    storeMarketingConsent("denied");

    expect(browser.gtag).toHaveBeenCalledWith("consent", "update", {
      ad_storage: "denied",
      analytics_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    expect(browser.fbq).toHaveBeenCalledWith("consent", "revoke");
    expect(browser.revokeConsent).toHaveBeenCalledOnce();
  });

  it("does not send provider events without granted consent", () => {
    const denied = createBrowserState("denied");
    trackMarketingEvent("generate_lead", { project_id: "project-1" });
    expect(denied.dataLayer).toHaveLength(0);
    expect(denied.fbq).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
    const granted = createBrowserState("granted");
    trackMarketingEvent("generate_lead", { project_id: "project-1" });
    expect(granted.gtag).toHaveBeenCalledWith("event", "generate_lead", {
      project_id: "project-1",
    });
    expect(granted.fbq).toHaveBeenCalledWith("track", "Lead", {
      project_id: "project-1",
    });
    expect(granted.track).toHaveBeenCalledWith("SubmitForm", {
      project_id: "project-1",
    });
  });

  it("sends Google Ads conversions to the configured target", () => {
    const browser = createBrowserState("granted");
    window.propertyGoJbGoogleAdsConversionTarget = "AW-123456/label";

    trackMarketingEvent("generate_lead", { value: 1 });

    expect(browser.gtag).toHaveBeenCalledWith("event", "conversion", {
      value: 1,
      send_to: "AW-123456/label",
    });
  });

  it("tracks client-side page views only with consent", () => {
    const denied = createBrowserState("denied");
    trackMarketingPageView("/about");
    expect(denied.gtag).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
    const granted = createBrowserState("granted");
    trackMarketingPageView("/about");
    expect(granted.gtag).toHaveBeenCalledWith("event", "page_view", {
      page_path: "/about",
    });
    expect(granted.fbq).toHaveBeenCalledWith("track", "PageView");
    expect(granted.page).toHaveBeenCalledOnce();
  });
});

describe("marketing attribution", () => {
  it("captures campaign, click ID, referrer, and landing path", () => {
    createBrowserState("granted");

    expect(getMarketingAttribution()).toMatchObject({
      source: "meta",
      medium: "paid",
      campaign: "launch",
      clickId: "click-1",
      referrer: "https://www.google.com/",
      landingPath:
        "/projects/vistara-hill?utm_source=meta&utm_medium=paid&utm_campaign=launch&fbclid=click-1",
    });
  });

  it("preserves first-touch attribution after navigation", () => {
    const browser = createBrowserState("granted");
    captureMarketingAttribution();

    window.location.pathname = "/contact";
    window.location.search = "";

    expect(getMarketingAttribution()).toMatchObject({
      source: "meta",
      campaign: "launch",
      clickId: "click-1",
      landingPath:
        "/projects/vistara-hill?utm_source=meta&utm_medium=paid&utm_campaign=launch&fbclid=click-1",
    });
    expect(browser.sessionStorage.size).toBe(1);
  });

  it("excludes campaign data without marketing consent", () => {
    createBrowserState("denied");

    expect(getMarketingAttribution()).toEqual({
      source: null,
      medium: null,
      campaign: null,
      content: null,
      term: null,
      clickId: null,
      referrer: null,
      landingPath: "/projects/vistara-hill",
    });
  });
});
