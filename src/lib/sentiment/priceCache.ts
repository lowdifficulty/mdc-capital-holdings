import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { PriceHistory, PriceSnapshot } from "./types";

const CACHE_FILE = path.join(process.cwd(), "data", "prices.json");

export type CachedChartRangeId = "1d" | "5d" | "1mo" | "1y" | "5y";

export const SNAPSHOT_TTL_MS = 5 * 60 * 1000;
export const INTRADAY_TTL_MS = 10 * 60 * 1000;
/** Re-merge daily bars from Yahoo at most once per hour per symbol. */
export const BARS_REFRESH_MS = 60 * 60 * 1000;

export interface DailyBar {
  t: number;
  c: number;
  o?: number;
  h?: number;
  l?: number;
  v?: number;
}

export interface CachedIntradaySeries {
  rangeId: CachedChartRangeId;
  points: { t: number; v: number }[];
  changePct: number;
  fetchedAt: string;
}

export interface CachedSymbolEntry {
  symbol: string;
  snapshot?: PriceSnapshot;
  history?: PriceHistory;
  dailyBars: DailyBar[];
  intraday?: Partial<Record<CachedChartRangeId, CachedIntradaySeries>>;
  snapshotAt?: string;
  barsAt?: string;
}

interface PriceCacheFile {
  version: 1;
  updatedAt: string;
  symbols: Record<string, CachedSymbolEntry>;
}

let memoryCache: PriceCacheFile | null = null;
let writeChain: Promise<void> = Promise.resolve();

function emptyCache(): PriceCacheFile {
  return { version: 1, updatedAt: new Date().toISOString(), symbols: {} };
}

async function readCacheFile(): Promise<PriceCacheFile> {
  if (memoryCache) return memoryCache;
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf-8");
    memoryCache = JSON.parse(raw) as PriceCacheFile;
    return memoryCache;
  } catch {
    memoryCache = emptyCache();
    return memoryCache;
  }
}

function schedulePersist(cache: PriceCacheFile): void {
  memoryCache = cache;
  cache.updatedAt = new Date().toISOString();
  writeChain = writeChain.then(async () => {
    await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
    await fs.writeFile(CACHE_FILE, JSON.stringify(cache));
  });
}

async function flushCache(): Promise<void> {
  await writeChain;
}

export async function readPriceCache(): Promise<PriceCacheFile> {
  return readCacheFile();
}

export function isSnapshotFresh(entry?: CachedSymbolEntry, now = Date.now()): boolean {
  if (!entry?.snapshot || !entry.snapshotAt) return false;
  return now - new Date(entry.snapshotAt).getTime() < SNAPSHOT_TTL_MS;
}

export function isIntradayFresh(series?: CachedIntradaySeries, now = Date.now()): boolean {
  if (!series?.points?.length || !series.fetchedAt) return false;
  return now - new Date(series.fetchedAt).getTime() < INTRADAY_TTL_MS;
}

export function needsBarRefresh(entry?: CachedSymbolEntry, now = Date.now()): boolean {
  if (!entry?.barsAt || entry.dailyBars.length === 0) return true;
  return now - new Date(entry.barsAt).getTime() >= BARS_REFRESH_MS;
}

export function mergeDailyBars(existing: DailyBar[], incoming: DailyBar[]): DailyBar[] {
  const map = new Map<number, DailyBar>();
  for (const bar of existing) map.set(bar.t, bar);
  for (const bar of incoming) map.set(bar.t, bar);
  return Array.from(map.values()).sort((a, b) => a.t - b.t);
}

export async function getCacheEntry(symbol: string): Promise<CachedSymbolEntry | null> {
  const cache = await readCacheFile();
  return cache.symbols[symbol.toUpperCase()] ?? null;
}

export async function getFreshSnapshots(
  symbols: string[]
): Promise<{ hits: Map<string, PriceSnapshot>; misses: string[] }> {
  const cache = await readCacheFile();
  const hits = new Map<string, PriceSnapshot>();
  const misses: string[] = [];

  for (const raw of symbols) {
    const sym = raw.toUpperCase();
    const entry = cache.symbols[sym];
    if (entry && isSnapshotFresh(entry) && entry.snapshot) {
      hits.set(sym, entry.snapshot);
    } else {
      misses.push(sym);
    }
  }

  return { hits, misses };
}

export async function getCachedIntraday(
  symbol: string,
  rangeId: CachedChartRangeId
): Promise<CachedIntradaySeries | null> {
  const entry = await getCacheEntry(symbol);
  const series = entry?.intraday?.[rangeId];
  if (!series || !isIntradayFresh(series)) return null;
  return series;
}

export async function upsertSymbolEntry(
  symbol: string,
  patch: {
    snapshot?: PriceSnapshot;
    history?: PriceHistory;
    dailyBars?: DailyBar[];
    intraday?: CachedIntradaySeries;
  }
): Promise<CachedSymbolEntry> {
  const cache = await readCacheFile();
  const sym = symbol.toUpperCase();
  const existing: CachedSymbolEntry = cache.symbols[sym] ?? {
    symbol: sym,
    dailyBars: [],
  };

  if (patch.dailyBars?.length) {
    existing.dailyBars = mergeDailyBars(existing.dailyBars, patch.dailyBars);
    existing.barsAt = new Date().toISOString();
  }
  if (patch.snapshot) {
    existing.snapshot = patch.snapshot;
    existing.snapshotAt = new Date().toISOString();
  }
  if (patch.history) {
    existing.history = patch.history;
  }
  if (patch.intraday) {
    existing.intraday = { ...existing.intraday, [patch.intraday.rangeId]: patch.intraday };
  }

  cache.symbols[sym] = existing;
  schedulePersist(cache);
  return existing;
}

export async function upsertManySymbolEntries(
  patches: Map<
    string,
    {
      snapshot?: PriceSnapshot;
      history?: PriceHistory;
      dailyBars?: DailyBar[];
      intraday?: CachedIntradaySeries;
    }
  >
): Promise<void> {
  if (!patches.size) return;
  const cache = await readCacheFile();
  const now = new Date().toISOString();

  for (const [raw, patch] of patches) {
    const sym = raw.toUpperCase();
    const existing: CachedSymbolEntry = cache.symbols[sym] ?? {
      symbol: sym,
      dailyBars: [],
    };

    if (patch.dailyBars?.length) {
      existing.dailyBars = mergeDailyBars(existing.dailyBars, patch.dailyBars);
      existing.barsAt = now;
    }
    if (patch.snapshot) {
      existing.snapshot = patch.snapshot;
      existing.snapshotAt = now;
    }
    if (patch.history) {
      existing.history = patch.history;
    }
    if (patch.intraday) {
      existing.intraday = { ...existing.intraday, [patch.intraday.rangeId]: patch.intraday };
    }

    cache.symbols[sym] = existing;
  }

  schedulePersist(cache);
  await flushCache();
}

export function chartSeriesFromDailyBars(
  symbol: string,
  rangeId: CachedChartRangeId,
  bars: DailyBar[]
): { symbol: string; range: CachedChartRangeId; points: { t: number; v: number }[]; changePct: number } | null {
  const days =
    rangeId === "1mo" ? 30 : rangeId === "1y" ? 365 : rangeId === "5y" ? 3650 : 0;
  if (!days) return null;

  const cutoff = Date.now() / 1000 - days * 86_400;
  const filtered = bars.filter((b) => b.t >= cutoff);
  if (filtered.length < 2) return null;

  const points = filtered.map((b) => ({ t: b.t * 1000, v: b.c }));
  const first = points[0].v;
  const last = points[points.length - 1].v;
  const changePct = first ? ((last - first) / first) * 100 : 0;

  return {
    symbol: symbol.toUpperCase(),
    range: rangeId,
    points,
    changePct,
  };
}

export async function getCacheStats(): Promise<{ symbols: number; dailyBars: number }> {
  const cache = await readCacheFile();
  let dailyBars = 0;
  for (const entry of Object.values(cache.symbols)) {
    dailyBars += entry.dailyBars.length;
  }
  return { symbols: Object.keys(cache.symbols).length, dailyBars };
}
