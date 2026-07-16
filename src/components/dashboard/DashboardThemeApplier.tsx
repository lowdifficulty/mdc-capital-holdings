"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initDashboardTheme } from "@/hooks/useDashboardTheme";
import {
  applyDashboardTheme,
  clearDashboardTheme,
  isDashboardRoute,
  resolveDashboardTheme,
  THEME_STORAGE_KEY,
} from "@/lib/dashboard/theme";

export default function DashboardThemeApplier() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isDashboardRoute(pathname)) {
      clearDashboardTheme();
      return;
    }

    initDashboardTheme();

    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onSystemChange = () => {
      try {
        if (localStorage.getItem(THEME_STORAGE_KEY)) return;
      } catch {
        /* ignore */
      }
      applyDashboardTheme(resolveDashboardTheme());
    };

    media.addEventListener("change", onSystemChange);
    return () => {
      media.removeEventListener("change", onSystemChange);
      if (!isDashboardRoute(pathname)) clearDashboardTheme();
    };
  }, [pathname]);

  return null;
}
