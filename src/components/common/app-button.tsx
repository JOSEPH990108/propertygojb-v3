import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { getAppButtonChildren } from "./app-button-children";

const appButtonVariants = cva(
  "h-12 rounded-2xl text-base font-semibold transition-all motion-safe:hover:-translate-y-0.5",
  {
    variants: {
      appVariant: {
        primary:
          "bg-brand text-brand-foreground shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)] hover:brightness-110",
        soft: "bg-brand-subtle text-brand-subtle-foreground hover:brightness-95",
        outline:
          "border border-border bg-background/80 text-foreground shadow-sm hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20",
      },
      appSize: {
        default: "",
        sm: "h-10 rounded-xl px-4 text-sm",
        lg: "h-14 rounded-2xl px-8 text-lg",
        icon: "size-12 rounded-2xl p-0",
      },
    },
    defaultVariants: {
      appVariant: "primary",
      appSize: "default",
    },
  },
);

type AppButtonProps = ComponentProps<typeof Button> &
  VariantProps<typeof appButtonVariants> & {
    /** Shows a spinner and marks the button busy without changing its accessible label. */
    isLoading?: boolean;
  };

export function AppButton({
  appVariant = "primary",
  appSize = "default",
  isLoading = false,
  className,
  children,
  disabled,
  asChild,
  ...props
}: AppButtonProps) {
  return (
    <Button
      asChild={asChild}
      className={cn(appButtonVariants({ appVariant, appSize }), className)}
      aria-busy={isLoading || undefined}
      disabled={disabled || isLoading}
      {...props}
    >
      {getAppButtonChildren({ asChild, isLoading, children })}
    </Button>
  );
}
