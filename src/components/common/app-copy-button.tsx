"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { appToast } from "@/lib/app-toast";
import { cn } from "@/lib/utils";

type AppCopyButtonProps = {
  value: string;
  label?: string;
  className?: string;
  disabled?: boolean;
};

export function AppCopyButton({
  value,
  label = "Copy",
  className,
  disabled,
}: AppCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!value || disabled) {
      return;
    }

    await navigator.clipboard.writeText(value);

    setCopied(true);
    appToast.success("Copied to clipboard.");

    window.setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  return (
    <button
      type="button"
      disabled={disabled || !value}
      onClick={handleCopy}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Copied" : label}
    </button>
  );
}
