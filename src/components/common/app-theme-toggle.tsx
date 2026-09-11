"use client";

import { useSyncExternalStore } from "react";
import { Check, Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
] as const;

type AppThemeToggleProps = {
  className?: string;
  showLabel?: boolean;
};

function subscribeToHydration() {
  return () => undefined;
}

export function AppThemeToggle({
  className,
  showLabel = false,
}: AppThemeToggleProps) {
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const { theme, resolvedTheme, setTheme } = useTheme();

  const ActiveIcon = isHydrated && resolvedTheme === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Change color theme"
          className={cn(
            "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-3 text-sm font-bold text-foreground shadow-sm transition hover:bg-accent",
            className,
          )}
        >
          <ActiveIcon className="size-4" />
          {showLabel ? <span>Theme</span> : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-40 rounded-xl p-1">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const active = isHydrated && theme === option.value;

          return (
            <DropdownMenuItem
              key={option.value}
              onSelect={() => setTheme(option.value)}
              className="flex cursor-pointer items-center gap-2 rounded-lg"
            >
              <Icon className="size-4" />
              <span className="flex-1">{option.label}</span>
              {active ? <Check className="size-4" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
