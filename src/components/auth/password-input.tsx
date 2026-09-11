"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<ComponentProps<typeof Input>, "type">;

export function PasswordInput({
  className,
  disabled,
  ...props
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={isVisible ? "text" : "password"}
        disabled={disabled}
        className={cn(
          "h-auto rounded-none border-0 border-b border-border bg-transparent px-2 pr-14 pt-3 pb-3 text-sm font-light shadow-none focus-visible:border-b-2 focus-visible:border-public-decorative focus-visible:ring-0 dark:bg-transparent",
          className,
        )}
        {...props}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsVisible((current) => !current)}
        className="absolute inset-y-0 right-0 flex items-center text-[0.65rem] font-medium tracking-[0.2em] text-muted-foreground uppercase transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={isVisible ? "Hide password" : "Show password"}
      >
        {isVisible ? (
          <span className="inline-flex items-center gap-1">
            <EyeOff className="size-3.5" />
            Hide
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3.5" />
            Show
          </span>
        )}
      </button>
    </div>
  );
}
