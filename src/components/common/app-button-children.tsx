import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

/**
 * Resolves AppButton's rendered children. Radix Slot (used by `asChild`) requires
 * exactly one child element, so the spinner is skipped rather than wrapped in a
 * fragment when composed with `asChild` — never render two children into a Slot.
 * Kept in its own module (no `@/` aliases) so it can be unit tested directly.
 */
export function getAppButtonChildren({
  asChild,
  isLoading,
  children,
}: {
  asChild?: boolean;
  isLoading?: boolean;
  children: ReactNode;
}): ReactNode {
  if (!isLoading || asChild) {
    return children;
  }

  return (
    <>
      <Loader2
        aria-hidden="true"
        className="size-4 animate-spin"
        data-icon="inline-start"
      />
      {children}
    </>
  );
}
