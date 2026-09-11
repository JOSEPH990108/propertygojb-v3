"use client";

import { useState, useTransition } from "react";

import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

type GoogleLoginButtonProps = {
  callbackURL?: string;
};

export function GoogleLoginButton({
  callbackURL = "/",
}: GoogleLoginButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGoogleLogin() {
    setError(null);

    startTransition(async () => {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });

      if (result.error) {
        setError(result.error.message ?? "Unable to continue with Google.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full rounded-none border-border bg-background text-sm font-medium tracking-[0.14em] uppercase hover:bg-muted"
        disabled={isPending}
        onClick={handleGoogleLogin}
      >
        <span className="mr-3 grid size-6 place-items-center rounded-full bg-background text-lg normal-case">
          G
        </span>
        {isPending ? "Redirecting..." : "Continue with Google"}
      </Button>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
