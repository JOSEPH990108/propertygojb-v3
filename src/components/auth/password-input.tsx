"use client";

import type { ComponentProps } from "react";
import { LockKeyhole } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = ComponentProps<typeof Input>;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  return (
    <div className="relative">
      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400" />

      <Input
        type="password"
        className={cn(
          "h-12 rounded-2xl border-slate-200 bg-white/80 pl-12 pr-4 shadow-sm",
          "focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20",
          className,
        )}
        {...props}
      />
    </div>
  );
}
