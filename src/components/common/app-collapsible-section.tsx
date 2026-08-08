import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type AppCollapsibleSectionProps = {
  children: ReactNode;
  title?: string;
  eyebrow?: string;
  description?: ReactNode;
  headerRight?: ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  className?: string;
  contentClassName?: string;
};

export function AppCollapsibleSection({
  children,
  title,
  eyebrow,
  description,
  headerRight,
  defaultOpen = true,
  collapsible = true,
  className,
  contentClassName,
}: AppCollapsibleSectionProps) {
  const isOpen = !collapsible || defaultOpen;

  return (
    <details
      open={isOpen}
      className={cn("group rounded-[2rem] border border-border bg-background p-6 shadow-sm", className)}
    >
      <summary className={cn("list-none", collapsible ? "cursor-pointer" : "pointer-events-none")}>
        <div className="flex items-start justify-between gap-4">
          <div>
            {eyebrow ? (
              <p className="text-sm font-black uppercase tracking-[0.24em] text-blue-700">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className={cn("text-2xl font-black tracking-tight text-foreground", eyebrow ? "mt-2" : "")}>
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className={cn("max-w-2xl text-sm leading-6 text-muted-foreground", title ? "mt-2" : "")}>
                {description}
              </p>
            ) : null}
          </div>

          <div className="flex items-start gap-3">
            {headerRight}
            {collapsible ? (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-slate-500 transition group-open:rotate-180">
                <ChevronDown className="size-4" />
              </span>
            ) : null}
          </div>
        </div>
      </summary>

      <div className={cn("mt-6", contentClassName)}>{children}</div>
    </details>
  );
}
