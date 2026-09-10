"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Lock } from "lucide-react";

import { cn } from "@/lib/utils";

import { PriceAuthModal } from "./price-auth-modal";

const PriceAuthContext = createContext<(() => void) | null>(null);

/** Wraps the project detail page so any number of `MaskedPrice` triggers share one modal instance. */
export function PriceAuthProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <PriceAuthContext.Provider value={() => setOpen(true)}>
      {children}
      <PriceAuthModal open={open} onOpenChange={setOpen} />
    </PriceAuthContext.Provider>
  );
}

type MaskedPriceProps = {
  isAuthenticated: boolean;
  value: string;
  className?: string;
};

/**
 * Renders the real price when the visitor is signed in; otherwise renders a
 * blurred placeholder that opens the shared login/register modal on click,
 * hover, or keyboard focus. Gating happens server-side (the caller only
 * passes `isAuthenticated` from the page's own session check), so the real
 * value never reaches an anonymous visitor's HTML in the first place.
 */
export function MaskedPrice({
  isAuthenticated,
  value,
  className,
}: MaskedPriceProps) {
  const openModal = useContext(PriceAuthContext);

  if (isAuthenticated) {
    return <span className={className}>{value}</span>;
  }

  return (
    <button
      type="button"
      onClick={() => openModal?.()}
      onMouseEnter={() => openModal?.()}
      onFocus={() => openModal?.()}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5",
        className,
      )}
      aria-label={`${value} — sign in to view pricing`}
    >
      <Lock aria-hidden="true" className="size-3.5 shrink-0 opacity-70" />
      <span aria-hidden="true" className="rounded-sm blur-[5px] select-none">
        {value}
      </span>
    </button>
  );
}
