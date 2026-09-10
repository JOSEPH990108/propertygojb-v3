import type { ReactNode } from "react";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type AppStepperItem = {
  label: string;
  icon?: ReactNode;
};

type AppStepperProps = {
  items: AppStepperItem[];
  currentStep: number;
  className?: string;
};

export function AppStepper({ items, currentStep, className }: AppStepperProps) {
  return (
    <div className={cn("mx-auto flex w-full max-w-sm items-start", className)}>
      {items.map((item, index) => {
        const isDone = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div
            key={item.label}
            className="flex flex-1 items-start last:flex-none"
          >
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "grid size-12 place-items-center rounded-full border border-border bg-background text-muted-foreground transition-all",
                  isActive &&
                    "border-primary bg-primary text-primary-foreground",
                  isDone && "border-success bg-success text-success-foreground",
                )}
              >
                {isDone ? <Check className="size-5" /> : item.icon}
              </div>

              <p
                className={cn(
                  "mt-3 text-xs font-medium tracking-[0.14em] whitespace-nowrap text-muted-foreground uppercase",
                  isActive && "text-foreground",
                  isDone && "text-success",
                )}
              >
                {item.label}
              </p>
            </div>

            {index < items.length - 1 ? (
              <div
                className={cn(
                  "mx-4 mt-6 h-px flex-1 bg-border",
                  isActive && "bg-primary",
                  isDone && "bg-success",
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
