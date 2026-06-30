import type { SentimentMention } from "./types";
import { labelFromScore, scoreText } from "./lexicon";

const UA = "MDC-Capital-Sentiment/1.0";

const ENDPOINTS = [
  "https://swaggystocks.com/api/wsb/ticker-mentions",
  "https://swaggystocks.com/api/wsb/mentions",
];

export interface SwaggyRow {
  ticker: string;
  mentions: number;
  sentiment?: number | string;
  name?: string;
}

interface SwaggyTicker {
  ticker?: string;
  symbol?: string;
  mentions?: number;
  sentiment?: number | string;
  name?: string;
}

function normalizeRows(data: unknown): SwaggyTicker[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as SwaggyTicker[];
    if (Array.isArray(obj.tickers)) return obj.tickers as SwaggyTicker[];
  }
  return [];
}

function toSwaggyRow(raw: SwaggyTicker): SwaggyRow | null {
  const ticker = (raw.ticker ?? raw.symbol ?? "").toUpperCase();
  if (!ticker) return null;
  return {
    ticker,
    mentions: raw.mentions ?? 0,
    sentiment: raw.sentiment,
    name: raw.name,
  };
}

export async function fetchAllSwaggyRows(): Promise<SwaggyRow[]> {
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        next: { revalidate: 0 },
      });
      if (!res.ok) continue;

      const rows = normalizeRows(await res.json())
        .map(toSwaggyRow)
        .filter((r): r is SwaggyRow => r !== null);

      if (rows.length) return rows;
    } catch {
      // try next endpoint
    }
  }
  return [];
}

export function swaggySentimentScore(row: SwaggyRow): number {
  if (typeof row.sentiment === "number") {
    return Math.max(-1, Math.min(1, row.sentiment));
  }
  if (typeof row.sentiment === "string") {
    return scoreText(row.sentiment);
  }
  if (row.mentions > 80) return 0.25;
  if (row.mentions > 30) return 0.1;
  return 0;
}

export async function fetchSwaggyStocks(symbol: string): Promise<SentimentMention[]> {
  const rows = await fetchAllSwaggyRows();
  const row = rows.find((r) => r.ticker === symbol.toUpperCase());
  if (!row) return [];

  const score = swaggySentimentScore(row);
  return [
    {
      id: `swaggystocks-${symbol}`,
      source: "swaggystocks",
      title: `${symbol} on SwaggyStocks WSB tracker (${row.mentions} mentions)`,
      summary: row.name,
      url: "https://swaggystocks.com/dashboard/wallstreetbets",
      publishedAt: new Date().toISOString(),
      score,
      label: labelFromScore(score),
      meta: { mentions: row.mentions },
    },
  ];
}
