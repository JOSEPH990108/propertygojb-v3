"use client";

import { useState } from "react";
import { Cookie, Settings2 } from "lucide-react";

import { AppButton } from "@/components/common/app-button";
import {
  storeMarketingConsent,
  type MarketingConsent,
} from "@/lib/public/analytics";
import { useMarketingConsent } from "@/lib/public/use-marketing-consent";

export function MarketingConsentBanner() {
  const storedConsent = useMarketingConsent();
  const [selectedConsent, setSelectedConsent] = useState<MarketingConsent | null>(null);
  const consent = selectedConsent ?? storedConsent;

  function chooseConsent(value: MarketingConsent) {
    storeMarketingConsent(value);
    setSelectedConsent(value);
  }

  if (consent !== null) {
    return null;
  }

  return (
    <aside
      aria-label="Privacy preferences"
      className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-3xl rounded-2xl border border-border bg-background/95 p-3 text-foreground shadow-2xl backdrop-blur-xl sm:bottom-5 sm:p-5"
    >
      <div className="grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-3 sm:flex sm:items-center sm:gap-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white sm:size-11">
          <Cookie className="size-4 sm:size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-black">Your privacy, your choice</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground sm:hidden">
            Essential storage keeps the site working. Marketing cookies help us measure campaigns and improve recommendations.
          </p>
          <p className="mt-1 hidden text-sm leading-6 text-muted-foreground sm:block">
            Essential storage keeps the site working. With your permission, analytics and advertising pixels help us measure campaigns and improve project recommendations.
          </p>
        </div>

        <div className="col-span-2 grid shrink-0 grid-cols-2 gap-2 sm:flex">
          <AppButton
            type="button"
            appVariant="outline"
            onClick={() => chooseConsent("denied")}
            className="h-10 rounded-xl px-4 text-sm"
          >
            Essential only
          </AppButton>
          <AppButton
            type="button"
            onClick={() => chooseConsent("granted")}
            className="h-10 rounded-xl px-4 text-sm"
          >
            Allow marketing
          </AppButton>
        </div>
      </div>
    </aside>
  );
}

export function MarketingConsentSettingsButton() {
  function resetConsent() {
    storeMarketingConsent("denied");
    window.localStorage.removeItem("propertygojb-marketing-consent");
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={resetConsent}
      className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
    >
      <Settings2 className="size-4" />
      Privacy choices
    </button>
  );
}
