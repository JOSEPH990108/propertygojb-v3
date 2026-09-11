"use client";

import { useSyncExternalStore } from "react";

import {
  getStoredMarketingConsent,
  MARKETING_CONSENT_EVENT,
} from "@/lib/public/analytics";

function subscribeToMarketingConsent(onStoreChange: () => void) {
  window.addEventListener(MARKETING_CONSENT_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(MARKETING_CONSENT_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function useMarketingConsent() {
  return useSyncExternalStore(
    subscribeToMarketingConsent,
    getStoredMarketingConsent,
    () => null,
  );
}
