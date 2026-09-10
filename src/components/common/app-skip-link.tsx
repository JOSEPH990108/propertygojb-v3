import { cn } from "@/lib/utils";

type AppSkipLinkProps = {
  /** Must match the `id` of the page's main landmark. */
  targetId: string;
  className?: string;
};

/** Visually-hidden-until-focus "Skip to content" link. Reused by public/internal/auth shells. */
export function AppSkipLink({ targetId, className }: AppSkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        "sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-50 focus-visible:rounded-lg focus-visible:bg-background focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-semibold focus-visible:text-foreground focus-visible:shadow-lg focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      Skip to content
    </a>
  );
}
