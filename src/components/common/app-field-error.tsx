import { cn } from "@/lib/utils";

type AppFieldErrorProps = {
  /** Stable id to pass into the related input's aria-describedby. */
  id: string;
  children?: string | null;
  className?: string;
};

/** Renders a field's error text with a stable id for aria-describedby association. */
export function AppFieldError({ id, children, className }: AppFieldErrorProps) {
  if (!children) return null;

  return (
    <p
      id={id}
      role="alert"
      className={cn("text-sm font-medium text-destructive", className)}
    >
      {children}
    </p>
  );
}
