import "server-only";
import type { PriceHistory, PriceSnapshot } from "./types";
import { toTradingViewSymbol } from "./tradingViewSymbol";
import { fetchYahooChartData } from "./yahooSession";
import {
  type DailyBar,
  getCacheEntry,
  getFreshSnapshots,
  needsBarRefresh,
  upsertManySymbolEntries,
  upsertSymbolEntry,
} from "./priceCache";

interface YahooChartMeta {
  regularMarketPrice?: number;
  previousClose?: number;
  longName?: string;
  shortName?: string;
  exchangeName?: string;
}

export interface YahooChartResult {
  meta?: YahooChartMeta;
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      close?: (number | null)[];
      open?: (number | null)[];
      high?: (number | null)[];
      low?: (number | null)[];
      volume?: (number | null)[];
    }>;
  };
}

interface YahooChartResponse {
  chart?: { result?: YahooChartResult[] };
}

function pctChange(current: number, prior: number): number {
  if (!prior || prior === 0) return 0;
  return ((current - prior) / prior) * 100;
}

function closeOnOrBefore(
  timestamps: number[],
  closes: (number | null)[],
  daysAgo: number
): number | null {
  const target = Date.now() / 1000 - daysAgo * 86_400;
  let best: number | null = null;
  let bestTs = -1;

  for (let i = 0; i < timestamps.length; i++) {
    const ts = timestamps[i];
    const close = closes[i];
    if (close == null || ts > target) continue;
    if (ts >= bestTs) {
      bestTs = ts;
      best = close;
    }
  }
  return best;
}

function oldestClose(closes: (number | null)[]): number | null {
  for (let i = 0; i < closes.length; i++) {
    if (closes[i] != null) return closes[i]!;
  }
  return null;
}

export function extractDailyBars(result: YahooChartResult): DailyBar[] {
  const timestamps = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0];
  const closes = quote?.close ?? [];
  const opens = quote?.open ?? [];
  const highs = quote?.high ?? [];
  const lows = quote?.low ?? [];
  const volumes = quote?.volume ?? [];

  const bars: DailyBar[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const c = closes[i];
    if (c == null) continue;
    const bar: DailyBar = { t: timestamps[i], c };
    const o = opens[i];
    const h = highs[i];
    const l = lows[i];
    const v = volumes[i];
    if (o != null) bar.o = o;
    if (h != null) bar.h = h;
    if (l != null) bar.l = l;
    if (v != null) bar.v = v;
    bars.push(bar);
  }
  return bars;
}

async function fetchYahooChart(symbol: string, range: string): Promise<YahooChartResult | null> {
  try {
    const data = (await fetchYahooChartData(symbol, { range, interval: "1d" })) as YahooChartResponse;
    return data?.chart?.result?.[0] ?? null;
  } catch {
    return null;
  }
}

function resolvePriorSessionClose(
  meta: YahooChartMeta | undefined,
  closes: (number | null)[]
): number | null {
  if (meta?.previousClose != null && meta.previousClose > 0) {
    return meta.previousClose;
  }
  if (closes.length >= 2) {
    const priorBar = closes[closes.length - 2];
    if (priorBar != null && priorBar > 0) return priorBar;
  }
  return null;
}

export function buildPriceHistory(result: YahooChartResult, symbol: string): PriceHistory | null {
  const meta = result.meta;
  const timestamps = result.timestamp ?? [];
  const closes = result.indicators?.quote?.[0]?.close ?? [];

  const price = meta?.regularMarketPrice ?? closes[closes.length - 1] ?? null;
  if (price == null) return null;

  const prevClose = resolvePriorSessionClose(meta, closes) ?? price;

  const fallback = oldestClose(closes) ?? prevClose;
  const weekClose = closeOnOrBefore(timestamps, closes, 7) ?? fallback;
  const monthClose = closeOnOrBefore(timestamps, closes, 30) ?? fallback;
  const sixMoClose = closeOnOrBefore(timestamps, closes, 182) ?? fallback;
  const yearClose = closeOnOrBefore(timestamps, closes, 365) ?? fallback;
  const fiveYearClose = closeOnOrBefore(timestamps, closes, 1825) ?? fallback;

  return {
    price,
    dailyChange: pctChange(price, prevClose),
    weeklyChange: pctChange(price, weekClose),
    monthlyChange: pctChange(price, monthClose),
    change6mo: pctChange(price, sixMoClose),
    change1y: pctChange(price, yearClose),
    change5y: pctChange(price, fiveYearClose),
    companyName: meta?.longName ?? meta?.shortName,
    tvSymbol: toTradingViewSymbol(symbol, meta?.exchangeName),
  };
}

function buildPriceHistoryFromBars(bars: DailyBar[], symbol: string): PriceHistory | null {
  if (!bars.length) return null;
  const timestamps = bars.map((b) => b.t);
  const closes = bars.map((b) => b.c);
  return buildPriceHistory(
    {
      timestamp: timestamps,
      indicators: { quote: [{ close: closes }] },
    },
    symbol
  );
}

function snapshotFromHistory(history: PriceHistory): PriceSnapshot {
  const { price, dailyChange, weeklyChange, monthlyChange, tvSymbol } = history;
  return { price, dailyChange, weeklyChange, monthlyChange, tvSymbol };
}

async function fetchAndCacheSymbol(
  symbol: string,
  range: "1y" | "5y"
): Promise<{ snapshot: PriceSnapshot | null; history: PriceHistory | null; dailyBars: DailyBar[] }> {
  const result = await fetchYahooChart(symbol, range);
  if (!result) return { snapshot: null, history: null, dailyBars: [] };

  const dailyBars = extractDailyBars(result);
  const history = buildPriceHistory(result, symbol);
  const snapshot = history ? snapshotFromHistory(history) : null;
  return { snapshot, history, dailyBars };
}

export async function fetchPriceSnapshot(symbol: string): Promise<PriceSnapshot | null> {
  const sym = symbol.toUpperCase();
  const { hits } = await getFreshSnapshots([sym]);
  const cached = hits.get(sym);
  if (cached) return cached;

  const { snapshot, dailyBars } = await fetchAndCacheSymbol(sym, "1y");
  if (!snapshot) return null;

  await upsertSymbolEntry(sym, { snapshot, dailyBars });
  return snapshot;
}

export async function fetchPriceHistory(symbol: string): Promise<PriceHistory | null> {
  const sym = symbol.toUpperCase();
  const { history, dailyBars } = await fetchAndCacheSymbol(sym, "5y");
  if (!history) return null;

  await upsertSymbolEntry(sym, { history, dailyBars, snapshot: snapshotFromHistory(history) });
  return history;
}

export interface BulkPriceResult {
  prices: Map<string, PriceSnapshot>;
  cached: number;
  fetched: number;
}

export async function fetchBulkPriceSnapshots(
  symbols: string[],
  concurrency = 4
): Promise<Map<string, PriceSnapshot>> {
  const result = await fetchBulkPriceSnapshotsWithStats(symbols, concurrency);
  return result.prices;
}

export async function fetchBulkPriceSnapshotsWithStats(
  symbols: string[],
  concurrency = 4
): Promise<BulkPriceResult> {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()))];
  const { hits, misses } = await getFreshSnapshots(unique);

  const out = new Map<string, PriceSnapshot>(hits);
  if (!misses.length) {
    return { prices: out, cached: hits.size, fetched: 0 };
  }

  const patches = new Map<string, { snapshot?: PriceSnapshot; dailyBars?: DailyBar[] }>();

  for (let i = 0; i < misses.length; i += concurrency) {
    const batch = misses.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (symbol) => {
        const entry = await getCacheEntry(symbol);
        if (entry && !needsBarRefresh(entry) && entry.dailyBars.length >= 5) {
          const history = buildPriceHistoryFromBars(entry.dailyBars, symbol);
          if (history) {
            return {
              symbol,
              snapshot: snapshotFromHistory(history),
              dailyBars: [] as DailyBar[],
            };
          }
        }
        const fetched = await fetchAndCacheSymbol(symbol, "1y");
        return {
          symbol,
          snapshot: fetched.snapshot,
          dailyBars: fetched.dailyBars,
        };
      })
    );

    for (const { symbol, snapshot, dailyBars } of results) {
      if (!snapshot) continue;
      out.set(symbol, snapshot);
      patches.set(symbol, { snapshot, dailyBars: dailyBars.length ? dailyBars : undefined });
    }
  }

  await upsertManySymbolEntries(patches);

  return {
    prices: out,
    cached: hits.size,
    fetched: patches.size,
  };
}

/** Live Yahoo quotes for portfolio P&L — always fetches market price, never stale bar-only estimates. */
export async function fetchLiveBulkPriceSnapshots(
  symbols: string[],
  concurrency = 5
): Promise<Map<string, PriceSnapshot>> {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()))];
  const out = new Map<string, PriceSnapshot>();
  const patches = new Map<string, { snapshot?: PriceSnapshot; dailyBars?: DailyBar[] }>();

  for (let i = 0; i < unique.length; i += concurrency) {
    const batch = unique.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (symbol) => {
        const fetched = await fetchAndCacheSymbol(symbol, "1y");
        return { symbol, ...fetched };
      })
    );

    for (const { symbol, snapshot, dailyBars } of results) {
      if (!snapshot) continue;
      out.set(symbol, snapshot);
      patches.set(symbol, { snapshot, dailyBars: dailyBars.length ? dailyBars : undefined });
    }
  }

  if (patches.size) await upsertManySymbolEntries(patches);
  return out;
}
