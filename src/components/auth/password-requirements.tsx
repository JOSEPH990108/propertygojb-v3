"use client";

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
    <div className="mt-3 border border-border bg-muted/40 p-4">
      <p className="mb-3 text-[0.65rem] font-medium tracking-[0.2em] text-muted-foreground uppercase">
        Password requirements
      </p>

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
                  "grid size-5 shrink-0 place-items-center rounded-full text-[12px] leading-none font-bold transition-colors",
                  passed
                    ? "bg-success text-success-foreground"
                    : "bg-border text-muted-foreground",
                )}
              >
                {passed ? "✓" : "×"}
              </span>

              <span
                className={cn(
                  "text-sm leading-5 transition-colors",
                  passed ? "text-foreground" : "text-muted-foreground",
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
