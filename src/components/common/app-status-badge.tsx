import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AppStatusBadgeTone =
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "neutral";

type AppStatusBadgeProps = {
  children: ReactNode;
  tone?: AppStatusBadgeTone;
  className?: string;
};

const toneClassNames: Record<AppStatusBadgeTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
};

export function AppStatusBadge({
  children,
  tone = "neutral",
  className,
}: AppStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center justify-center rounded-full border px-2.5 text-xs font-bold leading-none",
        toneClassNames[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
