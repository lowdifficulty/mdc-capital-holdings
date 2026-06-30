import type { OHLCVBar } from "./types";
import { fetchYahooChartData } from "@/lib/sentiment/yahooSession";

type Interval = "1m" | "5m" | "15m" | "1h" | "1d";

interface YahooQuote {
  open?: (number | null)[];
  high?: (number | null)[];
  low?: (number | null)[];
  close?: (number | null)[];
  volume?: (number | null)[];
}

function parseYahooBars(timestamps: number[], quote: YahooQuote): OHLCVBar[] {
  const bars: OHLCVBar[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const c = quote.close?.[i];
    if (c == null) continue;
    bars.push({
      t: timestamps[i] * 1000,
      o: quote.open?.[i] ?? c,
      h: quote.high?.[i] ?? c,
      l: quote.low?.[i] ?? c,
      c,
      v: quote.volume?.[i] ?? 0,
    });
  }
  return bars;
}

async function fetchYahooBars(symbol: string, interval: Interval, range: string): Promise<OHLCVBar[]> {
  const data = (await fetchYahooChartData(symbol, { interval, range })) as {
    chart?: { result?: Array<{ timestamp?: number[]; indicators?: { quote?: YahooQuote[] } }> };
  };
  const result = data?.chart?.result?.[0];
  if (!result) return [];
  const timestamps: number[] = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0] ?? {};
  return parseYahooBars(timestamps, quote);
}

async function fetchAlpacaBars(
  symbol: string,
  timeframe: string,
  limit = 200
): Promise<OHLCVBar[]> {
  const key = process.env.ALPACA_API_KEY;
  const secret = process.env.ALPACA_SECRET_KEY;
  const base = process.env.ALPACA_BASE_URL ?? "https://data.alpaca.markets";
  if (!key || !secret) return [];

  const feed = process.env.ALPACA_DATA_FEED ?? "iex";
  const url = `${base}/v2/stocks/${encodeURIComponent(symbol)}/bars?timeframe=${timeframe}&limit=${limit}&feed=${feed}`;
  try {
    const res = await fetch(url, {
      headers: { "APCA-API-KEY-ID": key, "APCA-API-SECRET-KEY": secret },
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.bars ?? []).map((b: { t: string; o: number; h: number; l: number; c: number; v: number }) => ({
      t: new Date(b.t).getTime(),
      o: b.o,
      h: b.h,
      l: b.l,
      c: b.c,
      v: b.v,
    }));
  } catch {
    return [];
  }
}

const YAHOO_RANGE: Record<Interval, string> = {
  "1m": "1d",
  "5m": "5d",
  "15m": "5d",
  "1h": "1mo",
  "1d": "2y",
};

export interface MarketDataBundle {
  daily: OHLCVBar[];
  intraday: OHLCVBar[];
  bars5m: OHLCVBar[];
  bars15m: OHLCVBar[];
  bars1h: OHLCVBar[];
}

export async function fetchMarketData(symbol: string): Promise<MarketDataBundle> {
  const [alpacaDaily, alpaca5m] = await Promise.all([
    fetchAlpacaBars(symbol, "1Day", 300),
    fetchAlpacaBars(symbol, "5Min", 80),
  ]);

  const daily =
    alpacaDaily.length >= 30
      ? alpacaDaily
      : await fetchYahooBars(symbol, "1d", YAHOO_RANGE["1d"]);

  const bars5m =
    alpaca5m.length >= 10
      ? alpaca5m
      : await fetchYahooBars(symbol, "5m", YAHOO_RANGE["5m"]);

  const [bars15m, bars1h, intraday] = await Promise.all([
    fetchYahooBars(symbol, "15m", YAHOO_RANGE["15m"]),
    fetchYahooBars(symbol, "1h", YAHOO_RANGE["1h"]),
    fetchYahooBars(symbol, "5m", YAHOO_RANGE["5m"]),
  ]);

  return { daily, intraday, bars5m, bars15m, bars1h };
}
