import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppIconButtonProps = Omit<ComponentProps<typeof Button>, "children"> & {
  icon: LucideIcon;
  /** Required: renders as the button's accessible name since no visible text is shown. */
  label: string;
  size?: "icon-sm" | "icon" | "icon-lg";
};

/** Icon-only button that can never ship without an accessible name. */
export function AppIconButton({
  icon: Icon,
  label,
  size = "icon",
  variant = "ghost",
  className,
  ...props
}: AppIconButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      aria-label={label}
      title={label}
      className={cn(className)}
      {...props}
    >
      <Icon aria-hidden="true" />
    </Button>
  );
}
