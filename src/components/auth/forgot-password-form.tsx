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
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
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
import { buildPhoneNumber } from "@/lib/auth/phone";

const countryCodeOptions: AppSelectOption[] = [
  { value: "+60", label: "Malaysia", description: "+60", leading: "MY" },
  { value: "+65", label: "Singapore", description: "+65", leading: "SG" },
  { value: "+62", label: "Indonesia", description: "+62", leading: "ID" },
  { value: "+66", label: "Thailand", description: "+66", leading: "TH" },
  { value: "+91", label: "India", description: "+91", leading: "IN" },
];

type ForgotPasswordStep = "request" | "reset";

export function ForgotPasswordForm() {
  const router = useRouter();

  const [step, setStep] = useState<ForgotPasswordStep>("request");
  const [otpSent, setOtpSent] = useState(false);
  const [resetChallengeId, setResetChallengeId] = useState("");
  const [countryCode, setCountryCode] = useState("+60");
  const [mobile, setMobile] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const [isPending, startTransition] = useTransition();

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const phoneNumber = buildPhoneNumber(countryCode, mobile);
  const otpCode = otpDigits.join("");

  function handleSendCode() {
    if (!mobile.trim()) {
      appToast.error("Mobile number is required.");
      return;
    }

    startTransition(async () => {
      const result = await postJson(
        "/api/auth/mobile/forgot-password/request-otp",
        {
          countryCode,
          mobile,
        },
      );

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      setOtpSent(true);
      setResetChallengeId("");
      appToast.success(
        "OTP sent successfully.",
        "Check your dev server terminal.",
      );

      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    });
  }

  function handleVerifyCode() {
    if (!otpSent) {
      appToast.error("Please send the OTP code first.");
      return;
    }

    if (otpCode.length !== 6) {
      appToast.error("Please enter the 6-digit OTP code.");
      return;
    }

    startTransition(async () => {
      const result = await postJson<{ challengeId: string }>(
        "/api/auth/mobile/forgot-password/verify-otp",
        {
          countryCode,
          mobile,
          code: otpCode,
        },
      );

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      setResetChallengeId(result.challengeId);
      setStep("reset");
      appToast.success("OTP verified successfully.");
    });
  }

  function handleResetPassword() {
    if (!resetChallengeId) {
      appToast.error("Please verify OTP before resetting password.");
      setStep("request");
      return;
    }

    if (!isPasswordValid(newPassword)) {
      setShowPasswordRequirements(true);
      appToast.error(
        "Please make sure your new password meets all requirements.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      appToast.error("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const result = await postJson(
        "/api/auth/mobile/forgot-password/complete",
        {
          countryCode,
          mobile,
          challengeId: resetChallengeId,
          newPassword,
        },
      );

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success("Password reset successfully.", "Please login again.");
      router.push("/login");
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

    if (!pasted) {
      return;
    }

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
      title={step === "reset" ? "New password." : "Forgot password?"}
      description={
        step === "reset"
          ? "Create a stronger password for your account."
          : "Enter your mobile number and we will send a reset code."
      }
    >
      <AuthCard>
        <div className="space-y-6">
          <AppStepper
            currentStep={step === "reset" ? 1 : 0}
            items={[{ label: "Request Reset" }, { label: "New Password" }]}
          />

          {step === "request" ? (
            <div className="space-y-6">
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
                    triggerClassName="h-auto w-auto min-w-0 justify-start rounded-none border-0 border-b border-border bg-transparent px-2 pt-1 pb-3 shadow-none hover:bg-transparent dark:border-border dark:bg-transparent dark:hover:bg-transparent"
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
                    onChange={(event) => {
                      setMobile(event.target.value);
                      setOtpSent(false);
                      setOtpDigits(["", "", "", "", "", ""]);
                      setResetChallengeId("");
                    }}
                    placeholder="Enter mobile number"
                    inputMode="tel"
                    autoComplete="tel"
                    className="h-auto flex-1 rounded-none border-0 border-b border-border bg-transparent 2 pt-1 pb-3 text-sm font-light shadow-none focus-visible:border-b-2 focus-visible:border-public-decorative focus-visible:ring-0 dark:bg-transparent"
                  />
                </div>
              </div>

              {otpSent ? (
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
              ) : null}

              <AppButton
                type="button"
                disabled={isPending}
                onClick={otpSent ? handleVerifyCode : handleSendCode}
                className="w-full rounded-none text-xs font-medium tracking-[0.2em] uppercase"
              >
                {isPending
                  ? otpSent
                    ? "Verifying..."
                    : "Sending Code..."
                  : otpSent
                    ? "Verify Code"
                    : "Send Code"}
                <ArrowRight className="ml-2 size-4" />
              </AppButton>

              {otpSent ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSendCode}
                  className="w-full text-sm font-medium text-foreground underline underline-offset-4"
                >
                  Resend Code
                </button>
              ) : null}
            </div>
          ) : null}

          {step === "reset" ? (
            <div className="space-y-6">
              <div className="border border-border bg-muted/40 p-4">
                <p className="text-sm font-medium text-muted-foreground">
                  {phoneNumber}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[0.65rem] font-medium tracking-[0.24em] text-muted-foreground uppercase">
                  New Password
                </label>
                <PasswordInput
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  onFocus={() => setShowPasswordRequirements(true)}
                  onBlur={() => setShowPasswordRequirements(false)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />

                <PasswordRequirements
                  password={newPassword}
                  visible={showPasswordRequirements}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[0.65rem] font-medium tracking-[0.24em] text-muted-foreground uppercase">
                  Confirm Password
                </label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </div>

              <AppButton
                type="button"
                disabled={isPending}
                onClick={handleResetPassword}
                className="w-full rounded-none text-xs font-medium tracking-[0.2em] uppercase"
              >
                {isPending ? "Resetting..." : "Reset Password"}
                <ArrowRight className="ml-2 size-4" />
              </AppButton>

              <button
                type="button"
                className="w-full text-sm font-medium text-foreground underline underline-offset-4"
                onClick={() => setStep("request")}
              >
                Back to Verify Code
              </button>
            </div>
          ) : null}

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-4"
            >
              <ArrowLeft className="size-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </AuthCard>
    </AuthPageShell>
  );
}
