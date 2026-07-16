"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  applyDashboardTheme,
  readDashboardThemeSnapshot,
  resolveDashboardTheme,
  setDashboardTheme,
  subscribeDashboardTheme,
  type DashboardTheme,
} from "@/lib/dashboard/theme";

export function useDashboardTheme() {
  const theme = useSyncExternalStore(
    subscribeDashboardTheme,
    readDashboardThemeSnapshot,
    () => "dark" as DashboardTheme
  );

  const toggleTheme = useCallback(() => {
    setDashboardTheme(theme === "dark" ? "light" : "dark");
  }, [theme]);

  const setTheme = useCallback((next: DashboardTheme) => {
    setDashboardTheme(next);
  }, []);

  return { theme, toggleTheme, setTheme };
}

export function initDashboardTheme(): DashboardTheme {
  const theme = resolveDashboardTheme();
  applyDashboardTheme(theme);
  return theme;
}
