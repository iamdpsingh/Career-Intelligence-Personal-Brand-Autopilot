"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
// @ts-ignore - next-themes types might not be perfectly resolved
import type { ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
