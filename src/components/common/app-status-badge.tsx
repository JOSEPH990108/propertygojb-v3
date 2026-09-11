import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AppStatusBadgeTone = "success" | "danger" | "warning" | "info" | "neutral";

type AppStatusBadgeProps = {
  children: ReactNode;
  tone?: AppStatusBadgeTone;
  className?: string;
  /** Adds a colored dot so the tone is not conveyed by color/text alone. */
  dot?: boolean;
};

const toneClassNames: Record<AppStatusBadgeTone, string> = {
  success: "border-success/30 bg-success/15 text-success",
  danger: "border-destructive/30 bg-destructive/15 text-destructive",
  warning: "border-warning/30 bg-warning/15 text-warning",
  info: "border-info/30 bg-info/15 text-info",
  neutral: "border-border bg-muted text-muted-foreground",
};

const dotClassNames: Record<AppStatusBadgeTone, string> = {
  success: "bg-success",
  danger: "bg-destructive",
  warning: "bg-warning",
  info: "bg-info",
  neutral: "bg-muted-foreground",
};

export function AppStatusBadge({
  children,
  tone = "neutral",
  className,
  dot = false,
}: AppStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center justify-center gap-1.5 rounded-full border px-2.5 text-xs font-bold leading-none",
        toneClassNames[tone],
        className,
      )}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0 rounded-full", dotClassNames[tone])}
        />
      )}
      {children}
    </span>
  );
}
