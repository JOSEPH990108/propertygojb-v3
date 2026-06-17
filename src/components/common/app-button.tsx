import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppButtonProps = ComponentProps<typeof Button> & {
  appVariant?: "primary" | "soft" | "outline";
};

export function AppButton({
  appVariant = "primary",
  className,
  children,
  ...props
}: AppButtonProps) {
  return (
    <Button
      className={cn(
        "h-12 rounded-2xl text-base font-semibold transition-all",
        appVariant === "primary" &&
          "bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 text-white shadow-[0_18px_40px_-18px_rgba(37,99,235,0.9)] hover:-translate-y-0.5 hover:from-blue-500 hover:to-blue-700",
        appVariant === "soft" &&
          "bg-blue-50 text-blue-700 hover:bg-blue-100",
        appVariant === "outline" &&
          "border border-slate-200 bg-white/80 text-slate-950 shadow-sm hover:bg-slate-50",
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
