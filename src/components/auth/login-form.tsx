"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { PasswordInput } from "@/components/auth/password-input";
import { AppButton } from "@/components/common/app-button";
import {
  AppSelect,
  type AppSelectOption,
} from "@/components/common/app-select";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";
import { authClient } from "@/lib/auth/client";
import { buildPhoneNumber } from "@/lib/auth/phone";

const countryCodeOptions: AppSelectOption[] = [
  { value: "+60", label: "Malaysia", description: "+60", leading: "MY" },
  { value: "+65", label: "Singapore", description: "+65", leading: "SG" },
  { value: "+62", label: "Indonesia", description: "+62", leading: "ID" },
  { value: "+66", label: "Thailand", description: "+66", leading: "TH" },
  { value: "+91", label: "India", description: "+91", leading: "IN" },
];

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [countryCode, setCountryCode] = useState("+60");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isPending, startTransition] = useTransition();

  function handleLogin() {
    if (!mobile.trim() || !password) {
      appToast.error("Mobile number and password are required.");
      return;
    }

    const phoneNumber = buildPhoneNumber(countryCode, mobile);

    startTransition(async () => {
      const checkResult = await postJson("/api/auth/mobile/login/check", {
        countryCode,
        mobile,
      });

      if (!checkResult.ok) {
        appToast.error(checkResult.message);
        return;
      }

      const result = await authClient.signIn.phoneNumber({
        phoneNumber,
        password,
        rememberMe,
      });

      if (result.error) {
        appToast.error(
          result.error.message ?? "Invalid mobile number or password.",
        );
        return;
      }

      appToast.success("Login successful.");
      const requestedPath = searchParams.get("next");
      const safeNextPath =
        requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
          ? requestedPath
          : null;
      router.push(
        safeNextPath
          ? `/auth-redirect?next=${encodeURIComponent(safeNextPath)}`
          : "/auth-redirect",
      );
      router.refresh();
    });
  }

  return (
    <AuthPageShell
      eyebrow="Account Access"
      title="Welcome back."
      description="Sign in with your mobile number to continue."
    >
      <AuthCard>
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
                triggerClassName="h-auto w-auto min-w-0 justify-start rounded-none border-0 border-b border-border bg-transparent px-2 pt-3 pb-3 shadow-none hover:bg-transparent dark:border-border dark:bg-transparent dark:hover:bg-transparent"
                renderValue={(option) => (
                  <span className="text-sm font-light">{option?.value}</span>
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
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center justify-between gap-4 text-sm">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="size-4 rounded-none border-border accent-foreground"
              />
              Remember me
            </label>

            <Link
              href="/forgot-password"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Forgot password?
            </Link>
          </div>

          <AppButton
            type="button"
            disabled={isPending}
            onClick={handleLogin}
            className="w-full rounded-none text-xs font-medium tracking-[0.2em] uppercase"
          >
            {isPending ? "Logging in..." : "Log In"}
          </AppButton>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground uppercase">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <GoogleLoginButton callbackURL="/auth-redirect" />

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Register
            </Link>
          </p>
        </div>
      </AuthCard>
    </AuthPageShell>
  );
}
