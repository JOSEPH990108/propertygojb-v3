"use client";

import {
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  useRef,
  useState,
  useTransition,
} from "react";
import { ArrowRight, LockKeyhole, Send, ShieldCheck, Smartphone } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { AppButton } from "@/components/common/app-button";
import { AppStepper } from "@/components/common/app-stepper";
import { AppSelect, type AppSelectOption } from "@/components/common/app-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const countryCodeOptions: AppSelectOption[] = [
  {
    value: "+60",
    label: "Malaysia",
    description: "+60",
    leading: "🇲🇾",
  },
  {
    value: "+65",
    label: "Singapore",
    description: "+65",
    leading: "🇸🇬",
  },
  {
    value: "+62",
    label: "Indonesia",
    description: "+62",
    leading: "🇮🇩",
  },
  {
    value: "+66",
    label: "Thailand",
    description: "+66",
    leading: "🇹🇭",
  },
  {
    value: "+91",
    label: "India",
    description: "+91",
    leading: "🇮🇳",
  },
];

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

function buildPhoneNumber(countryCode: string, localNumber: string) {
  const cleaned = localNumber.replace(/\D/g, "").replace(/^0+/, "");
  return `${countryCode}${cleaned}`;
}

type PhoneOtpFormProps = {
  mode: "login" | "register";
};

export function PhoneOtpForm({ mode }: PhoneOtpFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [countryCode, setCountryCode] = useState("+60");
  const [localNumber, setLocalNumber] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const nextPath = getSafeNextPath(searchParams.get("next"));
  const phoneNumber = buildPhoneNumber(countryCode, localNumber);
  const otpCode = otpDigits.join("");

  function handleSendOtp() {
    setError(null);
    setMessage(null);

    if (!localNumber.trim()) {
      setError("Mobile number is required.");
      return;
    }

    startTransition(async () => {
      const result = await authClient.phoneNumber.sendOtp({
        phoneNumber,
      });

      if (result.error) {
        setError(result.error.message ?? "Unable to send OTP.");
        return;
      }

      setOtpSent(true);
      setMessage("OTP sent. Check your dev server terminal for now.");

      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    });
  }

  function handleVerifyOtp() {
    setError(null);
    setMessage(null);

    if (otpCode.length !== 6) {
      setError("Please enter the 6-digit OTP code.");
      return;
    }

    startTransition(async () => {
      const result = await authClient.phoneNumber.verify({
        phoneNumber,
        code: otpCode,
        disableSession: false,
        updatePhoneNumber: false,
      });

      if (result.error) {
        setError(result.error.message ?? "Invalid OTP.");
        return;
      }

      router.push(nextPath);
      router.refresh();
    });
  }

  function updateOtpDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...otpDigits];

    nextDigits[index] = digit;
    setOtpDigits(nextDigits);

    if (digit && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();

    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const nextDigits = ["", "", "", "", "", ""];
    pasted.split("").forEach((digit, index) => {
      nextDigits[index] = digit;
    });

    setOtpDigits(nextDigits);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  return (
    <div className="space-y-6">
      <AppStepper
        currentStep={otpSent ? 1 : 0}
        items={[
          {
            label: mode === "login" ? "Mobile Login" : "Account Details",
            icon: <Smartphone className="size-6" />,
          },
          {
            label: "Verification",
            icon: <ShieldCheck className="size-6" />,
          },
        ]}
      />

      <div className="space-y-2 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-blue-600 text-white shadow-[0_0_0_14px_rgba(37,99,235,0.10)]">
          {otpSent ? <LockKeyhole className="size-7" /> : <Smartphone className="size-7" />}
        </div>

        <h1 className="pt-4 text-3xl font-black tracking-tight text-slate-950">
          {otpSent
            ? "Verify Your Mobile Number"
            : mode === "login"
              ? "Welcome Back"
              : "Create Your Account"}
        </h1>

        <p className="mx-auto max-w-xs text-sm leading-6 text-slate-500">
          {otpSent
            ? "Enter the 6-digit verification code sent to your mobile number."
            : "Continue securely with your mobile number OTP."}
        </p>
      </div>

      {!otpSent ? (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-900">
            Mobile Number
          </label>

          <div className="flex gap-3">
            <AppSelect
              value={countryCode}
              options={countryCodeOptions}
              onValueChange={setCountryCode}
              searchable
              searchPlaceholder="Search country..."
              triggerClassName="w-[128px]"
              renderValue={(option) => (
                <span className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-md bg-blue-50 text-xs font-bold text-blue-700">
                    {option?.leading}
                  </span>
                  <span>{option?.value}</span>
                </span>
              )}
              renderOption={(option) => (
                <>
                  <span className="text-lg">{option.leading}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{option.label}</p>
                    <p className="text-xs text-slate-500">{option.description}</p>
                  </div>
                </>
              )}
            />

            <div className="relative flex-1">
              <Smartphone className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={localNumber}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setLocalNumber(event.target.value)
                }
                placeholder="Enter mobile number"
                inputMode="tel"
                autoComplete="tel"
                className="h-12 rounded-xl border-slate-200 bg-white/80 pl-11 shadow-sm"
              />
            </div>
          </div>

          <AppButton
            type="button"
            disabled={isPending}
            onClick={handleSendOtp}
            className="mt-5"
          >
            {isPending ? "Sending Code..." : "Send Code"}
            <ArrowRight className="ml-2 size-4" />
          </AppButton>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white/70 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-slate-600">
                {countryCode} {localNumber}
              </p>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-blue-600"
                onClick={() => {
                  setOtpSent(false);
                  setOtpDigits(["", "", "", "", "", ""]);
                  setMessage(null);
                  setError(null);
                }}
              >
                Edit
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-900">
              Enter the 6-digit code
            </label>

            <div className="grid grid-cols-6 gap-2 sm:gap-3">
              {otpDigits.map((digit, index) => (
                <Input
                  key={index}
                  ref={(element) => {
                    inputRefs.current[index] = element;
                  }}
                  value={digit}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    updateOtpDigit(index, event.target.value)
                  }
                  onKeyDown={(event: KeyboardEvent<HTMLInputElement>) =>
                    handleOtpKeyDown(index, event)
                  }
                  onPaste={handleOtpPaste}
                  inputMode="numeric"
                  maxLength={1}
                  className="h-12 rounded-xl border-slate-200 bg-white/80 text-center text-lg font-bold shadow-sm focus-visible:ring-blue-600 sm:h-14"
                />
              ))}
            </div>
          </div>

          <AppButton
            type="button"
            disabled={isPending}
            onClick={handleVerifyOtp}
          >
            {isPending ? "Verifying..." : "Verify & Continue"}
            <ArrowRight className="ml-2 size-4" />
          </AppButton>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-blue-600"
            disabled={isPending}
            onClick={handleSendOtp}
          >
            <Send className="mr-2 size-4" />
            Resend Code
          </Button>
        </div>
      )}

      {message ? <p className="text-center text-sm text-slate-500">{message}</p> : null}
      {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

import { authClient } from "@/lib/auth/client";
