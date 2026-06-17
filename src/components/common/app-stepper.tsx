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
          <div key={item.label} className="flex flex-1 items-start last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "grid size-14 place-items-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.5)] transition-all",
                  isActive &&
                    "border-blue-100 bg-blue-600 text-white shadow-[0_0_0_10px_rgba(37,99,235,0.10)]",
                  isDone &&
                    "border-emerald-100 bg-emerald-500 text-white shadow-[0_0_0_10px_rgba(16,185,129,0.10)]",
                )}
              >
                {isDone ? <Check className="size-6" /> : item.icon}
              </div>

              <p
                className={cn(
                  "mt-3 whitespace-nowrap text-xs font-semibold text-slate-500",
                  isActive && "text-blue-600",
                  isDone && "text-emerald-600",
                )}
              >
                {item.label}
              </p>
            </div>

            {index < items.length - 1 ? (
              <div
                className={cn(
                  "mx-4 mt-7 h-0.5 flex-1 rounded-full bg-slate-200",
                  isActive && "bg-blue-600",
                  isDone && "bg-emerald-400",
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
