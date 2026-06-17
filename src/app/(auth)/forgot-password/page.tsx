import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { AppButton } from "@/components/common/app-button";

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell>
      <AuthCard>
        <div className="space-y-6 text-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Forgot Password
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Mobile password reset flow will be added in the next batch.
            </p>
          </div>

          <AppButton asChild appVariant="outline" className="w-full">
            <Link href="/login">Back to Login</Link>
          </AppButton>
        </div>
      </AuthCard>
    </AuthPageShell>
  );
}
