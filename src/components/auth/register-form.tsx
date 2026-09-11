"use client";

import {
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordRequirements } from "@/components/auth/password-requirements";
import { AppButton } from "@/components/common/app-button";
import {
  AppSelect,
  type AppSelectOption,
} from "@/components/common/app-select";
import { AppStepper } from "@/components/common/app-stepper";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";
import { isPasswordValid } from "@/lib/auth/password-policy";

const countryCodeOptions: AppSelectOption[] = [
  { value: "+60", label: "Malaysia", description: "+60", leading: "MY" },
  { value: "+65", label: "Singapore", description: "+65", leading: "SG" },
  { value: "+62", label: "Indonesia", description: "+62", leading: "ID" },
  { value: "+66", label: "Thailand", description: "+66", leading: "TH" },
  { value: "+91", label: "India", description: "+91", leading: "IN" },
];

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<"details" | "verify">("details");
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+60");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [isPending, startTransition] = useTransition();

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const otpCode = otpDigits.join("");

  function handleStartRegistration() {
    if (!name.trim() || !mobile.trim() || !password) {
      appToast.error("Name, mobile number and password are required.");
      return;
    }

    if (!isPasswordValid(password)) {
      setShowPasswordRequirements(true);
      appToast.error("Please make sure your password meets all requirements.");
      return;
    }

    startTransition(async () => {
      const result = await postJson("/api/auth/mobile/register/request-otp", {
        name,
        countryCode,
        mobile,
        password,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      setStep("verify");
      appToast.success(
        "OTP sent successfully.",
        "Check your dev server terminal.",
      );

      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    });
  }

  function handleVerifyOtp() {
    if (otpCode.length !== 6) {
      appToast.error("Please enter the 6-digit OTP code.");
      return;
    }

    startTransition(async () => {
      const verifyResult = await postJson<{ challengeId: string }>(
        "/api/auth/mobile/register/verify-otp",
        {
          countryCode,
          mobile,
          code: otpCode,
        },
      );

      if (!verifyResult.ok) {
        appToast.error(verifyResult.message);
        return;
      }

      const completeResult = await postJson(
        "/api/auth/mobile/register/complete",
        {
          name,
          countryCode,
          mobile,
          password,
          challengeId: verifyResult.challengeId,
        },
      );

      if (!completeResult.ok) {
        appToast.error(completeResult.message);
        return;
      }

      appToast.success(
        "Registration completed.",
        "Please login with your mobile number.",
      );
      router.push(
        nextPath === "/"
          ? "/login"
          : `/login?next=${encodeURIComponent(nextPath)}`,
      );
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

  function handleOtpKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();

    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pasted) return;

    const nextDigits = ["", "", "", "", "", ""];
    pasted.split("").forEach((digit, index) => {
      nextDigits[index] = digit;
    });

    setOtpDigits(nextDigits);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  return (
    <AuthPageShell
      eyebrow="Account Access"
      title={step === "verify" ? "Verify your number." : "Create your account."}
      description={
        step === "verify"
          ? "Enter the 6-digit code sent to your mobile number."
          : "One account for saved projects, viewings, and enquiries."
      }
    >
      <AuthCard>
        <div className="space-y-6">
          <AppStepper
            currentStep={step === "verify" ? 1 : 0}
            items={[{ label: "Details" }, { label: "Verification" }]}
          />

          {step === "details" ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[0.65rem] font-medium tracking-[0.24em] text-muted-foreground uppercase">
                  Full Name
                </label>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className="h-auto rounded-none border-0 border-b border-border bg-transparent px-2 pt-3 pb-3 text-sm font-light shadow-none focus-visible:border-b-2 focus-visible:border-public-decorative focus-visible:ring-0 dark:bg-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[0.65rem] font-medium tracking-[0.24em] text-muted-foreground uppercase">
                  Mobile Number
                </label>

                <div className="flex gap-3">
                  <AppSelect
                    value={countryCode}
                    options={countryCodeOptions}
                    onValueChange={setCountryCode}
                    searchable
                    searchPlaceholder="Search country..."
                    triggerClassName="h-auto w-auto min-w-0 justify-start rounded-none border-0 border-b border-border bg-transparent px-2 pt-3 pb-3 shadow-none hover:bg-transparent dark:border-border dark:bg-transparent dark:hover:bg-transparent"
                    renderValue={(option) => (
                      <span className="text-sm font-light">
                        {option?.value}
                      </span>
                    )}
                    renderOption={(option) => (
                      <>
                        <span className="grid size-8 place-items-center bg-muted text-xs font-semibold text-foreground">
                          {option.leading}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground">
                            {option.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                      </>
                    )}
                  />

                  <Input
                    value={mobile}
                    onChange={(event) => setMobile(event.target.value)}
                    placeholder="Enter mobile number"
                    inputMode="tel"
                    autoComplete="tel"
                    className="h-auto flex-1 rounded-none border-0 border-b border-border bg-transparent px-2 pt-3 pb-3 text-sm font-light shadow-none focus-visible:border-b-2 focus-visible:border-public-decorative focus-visible:ring-0 dark:bg-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[0.65rem] font-medium tracking-[0.24em] text-muted-foreground uppercase">
                  Password
                </label>
                <PasswordInput
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onFocus={() => setShowPasswordRequirements(true)}
                  onBlur={() => setShowPasswordRequirements(false)}
                  placeholder="Enter password"
                  autoComplete="new-password"
                />

                <PasswordRequirements
                  password={password}
                  visible={showPasswordRequirements}
                />
              </div>

              <AppButton
                type="button"
                disabled={isPending}
                onClick={handleStartRegistration}
                className="w-full rounded-none text-xs font-medium tracking-[0.2em] uppercase"
              >
                {isPending ? "Sending Code..." : "Register Now"}
                <ArrowRight className="ml-2 size-4" />
              </AppButton>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground uppercase">
                  or
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <GoogleLoginButton callbackURL="/auth-redirect" />

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Login
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4 border border-border bg-muted/40 p-4">
                <p className="text-sm font-medium text-muted-foreground">
                  {countryCode} {mobile}
                </p>

                <button
                  type="button"
                  className="text-sm font-medium text-foreground underline underline-offset-4"
                  onClick={() => {
                    setStep("details");
                    setOtpDigits(["", "", "", "", "", ""]);
                  }}
                >
                  Edit
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-[0.65rem] font-medium tracking-[0.24em] text-muted-foreground uppercase">
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
                      className="h-12 rounded-none border-0 border-b border-border bg-transparent text-center text-lg font-medium shadow-none focus-visible:border-b-2 focus-visible:border-public-decorative focus-visible:ring-0 sm:h-14 dark:bg-transparent"
                    />
                  ))}
                </div>
              </div>

              <AppButton
                type="button"
                disabled={isPending}
                onClick={handleVerifyOtp}
                className="w-full rounded-none text-xs font-medium tracking-[0.2em] uppercase"
              >
                {isPending ? "Verifying..." : "Verify & Continue"}
                <ArrowRight className="ml-2 size-4" />
              </AppButton>
            </div>
          )}
        </div>
      </AuthCard>
    </AuthPageShell>
  );
}
