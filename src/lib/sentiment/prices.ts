import type { PriceSnapshot } from "./types";

const UA = "MDC-Capital-Sentiment/1.0";

interface YahooChartMeta {
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
}

interface YahooChartResult {
  meta?: YahooChartMeta;
  timestamp?: number[];
  indicators?: { quote?: Array<{ close?: (number | null)[] }> };
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

export async function fetchPriceSnapshot(symbol: string): Promise<PriceSnapshot | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as YahooChartResponse;
    const result = data.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const timestamps = result.timestamp ?? [];
    const closes = result.indicators?.quote?.[0]?.close ?? [];

    const price = meta?.regularMarketPrice ?? closes[closes.length - 1] ?? null;
    if (price == null) return null;

    const prevClose =
      meta?.chartPreviousClose ??
      meta?.previousClose ??
      closes[closes.length - 2] ??
      price;

    const weekClose = closeOnOrBefore(timestamps, closes, 7) ?? prevClose;
    const monthClose = closeOnOrBefore(timestamps, closes, 30) ?? weekClose;

    return {
      price,
      dailyChange: pctChange(price, prevClose),
      weeklyChange: pctChange(price, weekClose),
      monthlyChange: pctChange(price, monthClose),
    };
  } catch {
    return null;
  }
}

export async function fetchBulkPriceSnapshots(
  symbols: string[],
  concurrency = 8
): Promise<Map<string, PriceSnapshot>> {
  const out = new Map<string, PriceSnapshot>();
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()))];

  for (let i = 0; i < unique.length; i += concurrency) {
    const batch = unique.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (symbol) => {
        const snap = await fetchPriceSnapshot(symbol);
        return { symbol, snap };
      })
    );
    for (const { symbol, snap } of results) {
      if (snap) out.set(symbol, snap);
    }
  }

  return out;
}
