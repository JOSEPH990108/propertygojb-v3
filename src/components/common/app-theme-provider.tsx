"use client";

import type { ComponentProps } from "react";
import { ThemeProvider } from "next-themes";

type AppThemeProviderProps = ComponentProps<typeof ThemeProvider>;

/**
 * Global theme boundary for all three application surfaces.
 * Keep theme persistence here so public, agent, and admin UIs share one setting.
 */
export function AppThemeProvider({ children, ...props }: AppThemeProviderProps) {
  return <ThemeProvider {...props}>{children}</ThemeProvider>;
}
