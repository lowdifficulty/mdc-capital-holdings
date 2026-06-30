import type { MoversReport } from "@/lib/sentiment/types";

const MOVERS_CACHE_KEY = "mdc_dashboard_movers";

export function readMoversCache(): MoversReport | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(MOVERS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MoversReport;
    if (!parsed?.movers || !parsed.analyzedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeMoversCache(report: MoversReport): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(MOVERS_CACHE_KEY, JSON.stringify(report));
  } catch {
    /* quota or private mode — in-memory cache still works */
  }
}

export function clearMoversCache(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(MOVERS_CACHE_KEY);
  } catch {
    /* ignore */
  }
}
