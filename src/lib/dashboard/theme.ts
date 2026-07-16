export const THEME_STORAGE_KEY = "mdc-command-center-theme";

export type DashboardTheme = "dark" | "light";

export const DASHBOARD_THEME_EVENT = "dashboard-theme-change";

export function isDashboardRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/intelligence") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
  );
}

export function resolveDashboardTheme(): DashboardTheme {
  if (typeof window === "undefined") return "dark";

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* ignore */
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyDashboardTheme(theme: DashboardTheme): void {
  document.documentElement.setAttribute("data-dashboard-theme", theme);
}

export function clearDashboardTheme(): void {
  document.documentElement.removeAttribute("data-dashboard-theme");
}

export function setDashboardTheme(theme: DashboardTheme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
  applyDashboardTheme(theme);
  window.dispatchEvent(new CustomEvent(DASHBOARD_THEME_EVENT, { detail: theme }));
}

export function readDashboardThemeSnapshot(): DashboardTheme {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.getAttribute("data-dashboard-theme");
  return attr === "light" ? "light" : "dark";
}

export function subscribeDashboardTheme(onStoreChange: () => void): () => void {
  const onCustom = () => onStoreChange();
  window.addEventListener(DASHBOARD_THEME_EVENT, onCustom);
  return () => window.removeEventListener(DASHBOARD_THEME_EVENT, onCustom);
}
