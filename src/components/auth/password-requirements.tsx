"use client";

import { LockKeyhole } from "lucide-react";

import { passwordRequirements } from "@/lib/auth/password-policy";
import { cn } from "@/lib/utils";

type PasswordRequirementsProps = {
  password: string;
  visible: boolean;
};

export function PasswordRequirements({
  password,
  visible,
}: PasswordRequirementsProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="mt-2 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-600">
          <LockKeyhole className="size-4" />
        </span>

        <p className="text-sm font-semibold leading-none text-slate-700">
          Password requirements
        </p>
      </div>

      <div className="space-y-2">
        {passwordRequirements.map((requirement) => {
          const passed = requirement.test(password);

          return (
            <div
              key={requirement.label}
              className="grid grid-cols-[20px_1fr] items-center gap-3"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full text-[12px] font-bold leading-none transition-colors",
                  passed
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 text-slate-500",
                )}
              >
                {passed ? "✓" : "×"}
              </span>

              <span
                className={cn(
                  "text-sm leading-5 transition-colors",
                  passed ? "text-emerald-700" : "text-slate-500",
                )}
              >
                {requirement.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
