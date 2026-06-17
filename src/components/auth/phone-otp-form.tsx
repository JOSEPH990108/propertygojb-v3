"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export function PhoneOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const nextPath = getSafeNextPath(searchParams.get("next"));

  function handleSendOtp() {
    setError(null);
    setMessage(null);

    const normalizedPhone = phoneNumber.trim();

    if (!normalizedPhone) {
      setError("Phone number is required.");
      return;
    }

    startTransition(async () => {
      const result = await authClient.phoneNumber.sendOtp({
        phoneNumber: normalizedPhone,
      });

      if (result.error) {
        setError(result.error.message ?? "Unable to send OTP.");
        return;
      }

      setOtpSent(true);
      setMessage("OTP sent. Check your dev server terminal for now.");
    });
  }

  function handleVerifyOtp() {
    setError(null);
    setMessage(null);

    const normalizedPhone = phoneNumber.trim();
    const normalizedCode = code.trim();

    if (!normalizedPhone || !normalizedCode) {
      setError("Phone number and OTP code are required.");
      return;
    }

    startTransition(async () => {
      const result = await authClient.phoneNumber.verify({
        phoneNumber: normalizedPhone,
        code: normalizedCode,
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

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div>
        <h2 className="font-semibold">Phone OTP</h2>
        <p className="text-sm text-muted-foreground">
          Dev mode: OTP will print in the terminal.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone number</Label>
        <Input
          id="phoneNumber"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
          placeholder="+60123456789"
          autoComplete="tel"
        />
      </div>

      {otpSent ? (
        <div className="space-y-2">
          <Label htmlFor="otpCode">OTP code</Label>
          <Input
            id="otpCode"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="123456"
            inputMode="numeric"
            autoComplete="one-time-code"
          />
        </div>
      ) : null}

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={handleSendOtp}
        >
          {isPending ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
        </Button>

        {otpSent ? (
          <Button type="button" disabled={isPending} onClick={handleVerifyOtp}>
            {isPending ? "Verifying..." : "Verify & Login"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
