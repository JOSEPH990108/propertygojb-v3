"use client";

import { Save, ShieldCheck, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import { AppButton } from "@/components/common/app-button";
import { AppSelect } from "@/components/common/app-select";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";
import {
  PUBLIC_COUNTRY_CODE_OPTIONS,
  PUBLIC_DEFAULT_COUNTRY_CODE,
} from "@/lib/public/site";

type CustomerProfileFormProps = {
  initialName: string;
  initialNationality: string | null;
  initialPhoneNumber: string | null;
  email: string | null;
  emailVerified: boolean;
};

type PendingAction = "profile" | "request-phone" | "confirm-phone" | null;

function splitPhoneNumber(phoneNumber: string | null) {
  const countryCode = [...PUBLIC_COUNTRY_CODE_OPTIONS]
    .sort((left, right) => right.value.length - left.value.length)
    .find((option) => phoneNumber?.startsWith(option.value))?.value;

  return {
    countryCode: countryCode ?? PUBLIC_DEFAULT_COUNTRY_CODE,
    mobile: countryCode && phoneNumber ? phoneNumber.slice(countryCode.length) : "",
  };
}

export function CustomerProfileForm({
  initialName,
  initialNationality,
  initialPhoneNumber,
  email,
  emailVerified,
}: CustomerProfileFormProps) {
  const router = useRouter();
  const initialPhone = splitPhoneNumber(initialPhoneNumber);
  const [name, setName] = useState(initialName);
  const [nationality, setNationality] = useState(initialNationality ?? "");
  const [countryCode, setCountryCode] = useState(initialPhone.countryCode);
  const [mobile, setMobile] = useState("");
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState(initialPhoneNumber);
  const [otpCode, setOtpCode] = useState("");
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isPending, startTransition] = useTransition();

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPendingAction("profile");
    startTransition(async () => {
      try {
        const result = await postJson("/api/public/account/profile", {
          name,
          nationality,
        });

        if (!result.ok) {
          appToast.error(result.message);
          return;
        }

        appToast.success("Profile details updated.");
        router.refresh();
      } finally {
        setPendingAction(null);
      }
    });
  }

  function handleRequestOtp() {
    if (!mobile.trim()) {
      appToast.error("Enter your new mobile number.");
      return;
    }

    setPendingAction("request-phone");
    startTransition(async () => {
      try {
        const result = await postJson(
          "/api/public/account/profile/phone/request-otp",
          { countryCode, mobile },
        );

        if (!result.ok) {
          appToast.error(result.message);
          return;
        }

        setOtpCode("");
        setIsVerifyingPhone(true);
        appToast.success("Verification code sent.", "Check your dev server terminal.");
      } finally {
        setPendingAction(null);
      }
    });
  }

  function handleConfirmPhone() {
    if (!/^\d{6}$/.test(otpCode)) {
      appToast.error("Enter the 6-digit verification code.");
      return;
    }

    setPendingAction("confirm-phone");
    startTransition(async () => {
      try {
        const result = await postJson(
          "/api/public/account/profile/phone/confirm",
          { countryCode, mobile, code: otpCode },
        );

        if (!result.ok) {
          appToast.error(result.message);
          return;
        }

        setCurrentPhoneNumber(`${countryCode}${mobile.replace(/\D/g, "").replace(/^0+/, "")}`);
        setMobile("");
        setIsVerifyingPhone(false);
        setOtpCode("");
        appToast.success("Mobile number updated and verified.");
        router.refresh();
      } finally {
        setPendingAction(null);
      }
    });
  }

  return (
    <div className="mt-8 divide-y divide-border border-y border-border">
      <form className="grid gap-6 py-7 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]" onSubmit={handleProfileSubmit}>
        <div>
          <h3 className="font-black">Personal details</h3>
          <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
            These details are also synchronized to customer records linked to your account.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="customer-profile-name" className="text-sm font-bold">Full name</label>
            <Input
              id="customer-profile-name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
              maxLength={150}
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="customer-profile-nationality" className="text-sm font-bold">Nationality</label>
            <Input
              id="customer-profile-nationality"
              name="nationality"
              value={nationality}
              onChange={(event) => setNationality(event.target.value)}
              autoComplete="country-name"
              maxLength={100}
              placeholder="Optional"
              className="h-12 rounded-xl"
            />
          </div>

          <div className="flex items-end">
            <AppButton type="submit" disabled={isPending || !name.trim()} className="w-full rounded-xl sm:w-auto">
              <Save className="size-4" />
              {isPending && pendingAction === "profile" ? "Saving..." : "Save details"}
            </AppButton>
          </div>
        </div>
      </form>

      <div className="grid gap-6 py-7 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <div>
          <h3 className="font-black">Verified mobile</h3>
          <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
            Changing your login number requires a one-time code sent to the new number.
          </p>
          <p className="mt-3 text-sm font-bold text-foreground">
            Current: {currentPhoneNumber ?? "Not provided"}
          </p>
        </div>

        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
            <div className="space-y-2">
              <label id="customer-country-label" className="text-sm font-bold">Country code</label>
              <AppSelect
                id="customer-country-code"
                ariaLabelledBy="customer-country-label"
                value={countryCode}
                options={PUBLIC_COUNTRY_CODE_OPTIONS}
                onValueChange={setCountryCode}
                disabled={isVerifyingPhone || isPending}
                triggerClassName="w-full rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="customer-new-mobile" className="text-sm font-bold">New mobile number</label>
              <Input
                id="customer-new-mobile"
                name="mobile"
                value={mobile}
                onChange={(event) => setMobile(event.target.value)}
                inputMode="tel"
                autoComplete="tel-national"
                disabled={isVerifyingPhone || isPending}
                placeholder="Example: 104608699"
                className="h-12 rounded-xl"
              />
            </div>
          </div>

          {isVerifyingPhone ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/60">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-blue-700 dark:text-blue-300" />
                <div className="min-w-0 flex-1">
                  <label htmlFor="customer-phone-otp" className="text-sm font-black text-blue-900 dark:text-blue-100">
                    Verification code
                  </label>
                  <p className="mt-1 text-xs leading-5 text-blue-800 dark:text-blue-200">
                    Enter the six-digit code. Your current number remains active until verification succeeds.
                  </p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <Input
                      id="customer-phone-otp"
                      value={otpCode}
                      onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      className="h-11 max-w-48 rounded-xl bg-background font-mono text-lg tracking-[0.3em]"
                    />
                    <AppButton type="button" onClick={handleConfirmPhone} disabled={isPending} className="h-11 rounded-xl px-5 text-sm">
                      {isPending && pendingAction === "confirm-phone" ? "Verifying..." : "Verify and change"}
                    </AppButton>
                    <AppButton
                      type="button"
                      appVariant="outline"
                      disabled={isPending}
                      onClick={() => setIsVerifyingPhone(false)}
                      className="h-11 rounded-xl px-5 text-sm"
                    >
                      Cancel
                    </AppButton>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <AppButton type="button" onClick={handleRequestOtp} disabled={isPending || !mobile.trim()} className="rounded-xl">
              <Smartphone className="size-4" />
              {isPending && pendingAction === "request-phone" ? "Sending..." : "Send verification code"}
            </AppButton>
          )}
        </div>
      </div>

      <div className="grid gap-3 py-7 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <div>
          <h3 className="font-black">Email</h3>
          <p className="mt-1 text-sm text-muted-foreground">Email changes remain locked until verified email delivery is configured.</p>
        </div>
        <div>
          <p className="font-bold">{email ?? "No verified email added"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{emailVerified ? "Verified email" : "Email verification unavailable"}</p>
        </div>
      </div>
    </div>
  );
}