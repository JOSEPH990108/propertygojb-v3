"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import type { ContactEnquiryPath } from "./contact-enquiry-experience";

type ContactPathOption = {
  value: ContactEnquiryPath;
  icon: ReactNode;
  title: string;
  description: string;
};

type ContactPathSelectorProps = {
  path: ContactEnquiryPath;
  onPathChange: (path: ContactEnquiryPath) => void;
  options: ContactPathOption[];
};

export function ContactPathSelector({
  path,
  onPathChange,
  options,
}: ContactPathSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Choose how you'd like to start your enquiry"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      {options.map((option) => {
        const isActive = path === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onPathChange(option.value)}
            className={cn(
              "flex items-center gap-3 border p-4 text-left transition-colors",
              isActive
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border bg-card text-card-foreground hover:bg-muted",
            )}
          >
            <span
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-full",
                isActive
                  ? "bg-brand-foreground/15 text-brand-foreground"
                  : "bg-brand-subtle text-brand-subtle-foreground",
              )}
            >
              {option.icon}
            </span>
            <span>
              <span className="block text-sm font-black">{option.title}</span>
              <span
                className={cn(
                  "block text-xs leading-5",
                  isActive ? "text-brand-foreground/80" : "text-muted-foreground",
                )}
              >
                {option.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
