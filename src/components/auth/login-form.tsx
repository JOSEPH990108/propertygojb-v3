"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { PasswordInput } from "@/components/auth/password-input";
import { AppButton } from "@/components/common/app-button";
import { AppSelect, type AppSelectOption } from "@/components/common/app-select";
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
        appToast.error(result.error.message ?? "Invalid mobile number or password.");
        return;
      }

      appToast.success("Login successful.");
      router.push("/auth-redirect");
      router.refresh();
    });
  }

  return (
    <AuthPageShell>
      <AuthCard>
        <div className="space-y-7">
          <div className="space-y-3 text-center">
            <h1 className="text-3xl font-black tracking-tight">Welcome Back</h1>
            <p className="mx-auto max-w-xs text-sm leading-6 text-slate-500">
              Login securely with your mobile number and password.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Mobile Number</label>

              <div className="flex gap-3">
                <AppSelect
                  value={countryCode}
                  options={countryCodeOptions}
                  onValueChange={setCountryCode}
                  searchable
                  searchPlaceholder="Search country..."
                  triggerClassName="w-[132px]"
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
                      <span className="grid size-8 place-items-center rounded-md bg-blue-50 text-xs font-bold text-blue-700">
                        {option.leading}
                      </span>
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
                    value={mobile}
                    onChange={(event) => setMobile(event.target.value)}
                    placeholder="Enter mobile number"
                    inputMode="tel"
                    autoComplete="tel"
                    className="h-12 rounded-2xl border-slate-200 bg-white/80 pl-11 shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Password</label>
              <PasswordInput
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between gap-4 text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="size-4 rounded border-slate-300 accent-blue-600"
                />
                Remember me
              </label>

              <Link href="/forgot-password" className="font-semibold text-blue-600">
                Forgot Password?
              </Link>
            </div>

            <AppButton
              type="button"
              disabled={isPending}
              onClick={handleLogin}
              className="w-full"
            >
              {isPending ? "Logging in..." : "Log In"}
            </AppButton>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">or</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <GoogleLoginButton callbackURL="/auth-redirect" />

            <p className="text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-blue-600">
                Register
              </Link>
            </p>
          </div>
        </div>
      </AuthCard>
    </AuthPageShell>
  );
}
