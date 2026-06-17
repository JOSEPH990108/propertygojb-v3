"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<ComponentProps<typeof Input>, "type">;

export function PasswordInput({ className, disabled, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400" />

      <Input
        type={isVisible ? "text" : "password"}
        disabled={disabled}
        className={cn(
          "h-12 rounded-2xl border-slate-200 bg-white/80 pl-12 pr-12 shadow-sm",
          "focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20",
          className,
        )}
        {...props}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsVisible((current) => !current)}
        className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={isVisible ? "Hide password" : "Show password"}
      >
        {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
