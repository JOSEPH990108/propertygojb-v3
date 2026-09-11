import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type AppEmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

/** Shared "no results yet" panel for empty lists, empty search results, and empty account sections. */
export function AppEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: AppEmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <Icon aria-hidden="true" className="size-10 text-muted-foreground" />
      )}
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action}
    </div>
  );
}
