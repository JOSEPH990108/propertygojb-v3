"use client";

import {
  type ClipboardEvent,
  type KeyboardEvent,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordRequirements } from "@/components/auth/password-requirements";
import { AppButton } from "@/components/common/app-button";
import { AppSelect } from "@/components/common/app-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";
import { authClient } from "@/lib/auth/client";
import { isPasswordValid } from "@/lib/auth/password-policy";
import { buildPhoneNumber } from "@/lib/auth/phone";
import { PUBLIC_COUNTRY_CODE_OPTIONS } from "@/lib/public/site";

type PriceAuthModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Login/register modal for the price-visibility gate. Deliberately never
 * navigates away from the current page (no `/login`, `/register`, or
 * `/auth-redirect`) so the visitor lands back at the exact same section the
 * instant they finish — `/auth-redirect`'s role-route allowlist is an
 * `enforced`/`R3` rule (`BR-AUTH-003`) that only permits internal
 * `/account`, `/agent`, `/admin` destinations, not arbitrary public pages, so
 * routing through it would not actually return the visitor to this project
 * page. Google sign-in uses the current page's own URL as its `callbackURL`,
 * which is Better Auth's own OAuth callback (a different, already-safe
 * same-origin mechanism), not the app's `next`/`auth-redirect` allowlist.
 */
export function PriceAuthModal({ open, onOpenChange }: PriceAuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");

  const [loginCountryCode, setLoginCountryCode] = useState("+60");
  const [loginMobile, setLoginMobile] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoginPending, startLoginTransition] = useTransition();

  const [registerStep, setRegisterStep] = useState<"details" | "verify">(
    "details",
  );
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+60");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [isRegisterPending, startRegisterTransition] = useTransition();
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const otpCode = otpDigits.join("");

  function getCallbackUrl() {
    return typeof window === "undefined" ? "/" : window.location.href;
  }

  function handleAuthenticated() {
    onOpenChange(false);
    router.refresh();
  }

  function handleLogin() {
    if (!loginMobile.trim() || !loginPassword) {
      appToast.error("Mobile number and password are required.");
      return;
    }

    const phoneNumber = buildPhoneNumber(loginCountryCode, loginMobile);

    startLoginTransition(async () => {
      const checkResult = await postJson("/api/auth/mobile/login/check", {
        countryCode: loginCountryCode,
        mobile: loginMobile,
      });

      if (!checkResult.ok) {
        appToast.error(checkResult.message);
        return;
      }

      const result = await authClient.signIn.phoneNumber({
        phoneNumber,
        password: loginPassword,
        rememberMe: true,
      });

      if (result.error) {
        appToast.error(
          result.error.message ?? "Invalid mobile number or password.",
        );
        return;
      }

      appToast.success("Login successful.");
      handleAuthenticated();
    });
  }

  function signInAfterRegister() {
    const phoneNumber = buildPhoneNumber(countryCode, mobile);

    startRegisterTransition(async () => {
      const result = await authClient.signIn.phoneNumber({
        phoneNumber,
        password,
        rememberMe: true,
      });

      if (result.error) {
        appToast.success(
          "Registration completed.",
          "Please log in with your new account.",
        );
        setMode("login");
        setLoginCountryCode(countryCode);
        setLoginMobile(mobile);
        return;
      }

      appToast.success("Welcome to PropertyGoJB.");
      handleAuthenticated();
    });
  }

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

    startRegisterTransition(async () => {
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

      setRegisterStep("verify");
      appToast.success(
        "OTP sent successfully.",
        "Check your dev server terminal.",
      );

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 50);
    });
  }

  function handleVerifyOtp() {
    if (otpCode.length !== 6) {
      appToast.error("Please enter the 6-digit OTP code.");
      return;
    }

    startRegisterTransition(async () => {
      const verifyResult = await postJson<{ challengeId: string }>(
        "/api/auth/mobile/register/verify-otp",
        { countryCode, mobile, code: otpCode },
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

      signInAfterRegister();
    });
  }

  function updateOtpDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = digit;
    setOtpDigits(nextDigits);

    if (digit && index < otpInputRefs.current.length - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
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
    otpInputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);

        if (!next) {
          setRegisterStep("details");
          setOtpDigits(["", "", "", "", "", ""]);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in to view pricing</DialogTitle>
          <DialogDescription>
            Register or log in to see exact prices, guide prices, and loan
            estimates for this project.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as "login" | "register")}
        >
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">
              Log in
            </TabsTrigger>
            <TabsTrigger value="register" className="flex-1">
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 pt-2">
            <div className="grid gap-3 sm:grid-cols-[150px_1fr]">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-foreground">
                  Country code
                </label>
                <AppSelect
                  value={loginCountryCode}
                  onValueChange={setLoginCountryCode}
                  options={PUBLIC_COUNTRY_CODE_OPTIONS}
                  searchable
                  searchPlaceholder="Search country..."
                  triggerClassName="h-12 w-full justify-between rounded-2xl border-border bg-background px-4 text-left text-sm font-semibold text-foreground shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-foreground">
                  Mobile number
                </label>
                <Input
                  value={loginMobile}
                  onChange={(event) => setLoginMobile(event.target.value)}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="Mobile number"
                  className="h-12 rounded-2xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-foreground">
                Password
              </label>
              <PasswordInput
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Enter your password"
              />
            </div>

            <AppButton
              type="button"
              disabled={isLoginPending}
              onClick={handleLogin}
              className="w-full"
            >
              {isLoginPending ? "Logging in..." : "Log in"}
            </AppButton>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground uppercase">
                or
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <GoogleLoginButton callbackURL={getCallbackUrl()} />
          </TabsContent>

          <TabsContent value="register" className="space-y-4 pt-2">
            {registerStep === "details" ? (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-foreground">
                    Full name
                  </label>
                  <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    placeholder="Your name"
                    className="h-12 rounded-2xl"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-[150px_1fr]">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-foreground">
                      Country code
                    </label>
                    <AppSelect
                      value={countryCode}
                      onValueChange={setCountryCode}
                      options={PUBLIC_COUNTRY_CODE_OPTIONS}
                      searchable
                      searchPlaceholder="Search country..."
                      triggerClassName="h-12 w-full justify-between rounded-2xl border-border bg-background px-4 text-left text-sm font-semibold text-foreground shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-foreground">
                      Mobile number
                    </label>
                    <Input
                      value={mobile}
                      onChange={(event) => setMobile(event.target.value)}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      placeholder="Mobile number"
                      className="h-12 rounded-2xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-foreground">
                    Password
                  </label>
                  <PasswordInput
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onFocus={() => setShowPasswordRequirements(true)}
                    onBlur={() => setShowPasswordRequirements(false)}
                    autoComplete="new-password"
                    placeholder="Create a password"
                  />
                  <PasswordRequirements
                    password={password}
                    visible={showPasswordRequirements}
                  />
                </div>

                <AppButton
                  type="button"
                  disabled={isRegisterPending}
                  onClick={handleStartRegistration}
                  className="w-full"
                >
                  {isRegisterPending ? "Sending code..." : "Create account"}
                </AppButton>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground uppercase">
                    or
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <GoogleLoginButton callbackURL={getCallbackUrl()} />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4 border border-border bg-muted/40 p-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    {countryCode} {mobile}
                  </p>
                  <button
                    type="button"
                    className="text-sm font-medium text-foreground underline underline-offset-4"
                    onClick={() => {
                      setRegisterStep("details");
                      setOtpDigits(["", "", "", "", "", ""]);
                    }}
                  >
                    Edit
                  </button>
                </div>

                <div className="flex justify-center gap-2">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        otpInputRefs.current[index] = element;
                      }}
                      value={digit}
                      onChange={(event) =>
                        updateOtpDigit(index, event.target.value)
                      }
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      onPaste={handleOtpPaste}
                      inputMode="numeric"
                      maxLength={1}
                      className="size-12 rounded-xl border border-border bg-background text-center text-lg font-semibold text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                    />
                  ))}
                </div>

                <AppButton
                  type="button"
                  disabled={isRegisterPending}
                  onClick={handleVerifyOtp}
                  className="w-full"
                >
                  {isRegisterPending ? "Verifying..." : "Verify and continue"}
                </AppButton>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
