"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { PhoneOtpForm } from "@/components/auth/phone-otp-form";

type AuthOptionsFormProps = {
  mode: "login" | "register";
};

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

function AuthOptionsFormContent({ mode }: AuthOptionsFormProps) {
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const isLogin = mode === "login";

  return (
    <AuthPageShell>
      <AuthCard>
        <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
          <div className="grid size-10 place-items-center rounded-xl bg-blue-600 text-sm font-black text-white">
            PG
          </div>
          <div>
            <p className="text-lg font-black leading-none">PropertyGoJB</p>
            <p className="text-xs text-slate-500">Modern Property Platform</p>
          </div>
        </div>

        <div className="space-y-6">
          <PhoneOtpForm mode={mode} />

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <GoogleLoginButton callbackURL={nextPath} />

          <p className="text-center text-sm text-slate-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <Link
              href={isLogin ? "/register" : "/login"}
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              {isLogin ? "Register" : "Login"}
            </Link>
          </p>
        </div>
      </AuthCard>
    </AuthPageShell>
  );
}

export function AuthOptionsForm(props: AuthOptionsFormProps) {
  return (
    <Suspense fallback={null}>
      <AuthOptionsFormContent {...props} />
    </Suspense>
  );
}
