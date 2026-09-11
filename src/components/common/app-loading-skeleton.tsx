import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const pulse = "motion-safe:animate-pulse rounded-md bg-muted";

/** A single skeleton text line. Pass `className` to control width (e.g. "w-1/2"). */
export function AppSkeletonText({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn(pulse, "h-4 w-full", className)} />
  );
}

/** A skeleton for a card-shaped loading placeholder (image + two text lines). */
export function AppSkeletonCard({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "space-y-3 rounded-2xl border border-border p-4",
        className,
      )}
    >
      <div className={cn(pulse, "h-40 w-full")} />
      <div className={cn(pulse, "h-4 w-3/4")} />
      <div className={cn(pulse, "h-4 w-1/2")} />
    </div>
  );
}

/** A skeleton for a single table/list row. */
export function AppSkeletonRow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("flex items-center gap-4 py-3", className)}
    >
      <div className={cn(pulse, "size-9 shrink-0 rounded-full")} />
      <div className="flex-1 space-y-2">
        <div className={cn(pulse, "h-4 w-1/3")} />
        <div className={cn(pulse, "h-3 w-1/4")} />
      </div>
    </div>
  );
}

type AppLoadingStatusProps = {
  /** Accessible text announced to assistive tech while decorative skeletons render. */
  label?: string;
  children: ReactNode;
  className?: string;
};

/** Wraps decorative skeleton placeholders with an accessible loading announcement. */
export function AppLoadingStatus({
  label = "Loading content",
  children,
  className,
}: AppLoadingStatusProps) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
