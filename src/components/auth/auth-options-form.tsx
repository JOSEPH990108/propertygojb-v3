"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { PhoneOtpForm } from "@/components/auth/phone-otp-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isLogin ? "Login" : "Register"}</CardTitle>
        <CardDescription>
          Continue with Google or mobile number OTP.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <GoogleLoginButton callbackURL={nextPath} />
        <PhoneOtpForm />

        <div className="border-t pt-4 text-center text-sm text-muted-foreground">
          {isLogin ? (
            <>
              New here?{" "}
              <Link className="font-medium text-foreground underline" href="/register">
                Register
              </Link>
            </>
          ) : (
            <>
              Already have access?{" "}
              <Link className="font-medium text-foreground underline" href="/login">
                Login
              </Link>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AuthOptionsForm(props: AuthOptionsFormProps) {
  return (
    <Suspense fallback={null}>
      <AuthOptionsFormContent {...props} />
    </Suspense>
  );
}
