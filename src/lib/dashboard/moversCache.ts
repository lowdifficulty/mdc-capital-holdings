import type { MoversReport } from "@/lib/sentiment/types";

const MOVERS_CACHE_KEY = "mdc_dashboard_movers";
const MOVERS_CACHE_VERSION = 2;

interface MoversCacheEnvelope {
  version: number;
  report: MoversReport;
}

export function readMoversCache(): MoversReport | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(MOVERS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MoversCacheEnvelope | MoversReport;
    const report =
      "version" in parsed && "report" in parsed ? parsed.report : (parsed as MoversReport);
    const version = "version" in parsed ? parsed.version : 1;
    if (version < MOVERS_CACHE_VERSION) return null;
    if (!report?.movers || !report.analyzedAt) return null;
    return report;
  } catch {
    return null;
  }
}

export function writeMoversCache(report: MoversReport): void {
  if (typeof window === "undefined") return;
  try {
    const envelope: MoversCacheEnvelope = {
      version: MOVERS_CACHE_VERSION,
      report,
    };
    sessionStorage.setItem(MOVERS_CACHE_KEY, JSON.stringify(envelope));
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
