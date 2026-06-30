import type { SentimentMention } from "./types";
import { labelFromScore } from "./lexicon";

const UA = "MDC-Capital-Sentiment/1.0";

export interface ApeWisdomRow {
  ticker: string;
  name: string;
  mentions: number;
  mentions_24h_ago: number;
  upvotes: number;
  rank: number;
}

interface ApeWisdomResponse {
  results?: ApeWisdomRow[];
}

export function mentionVelocityScore(mentions: number, mentions24hAgo: number): number {
  if (mentions24hAgo <= 0) return mentions > 5 ? 0.25 : 0;
  const ratio = mentions / mentions24hAgo;
  if (ratio >= 2) return 0.45;
  if (ratio >= 1.3) return 0.2;
  if (ratio <= 0.6) return -0.25;
  if (ratio <= 0.85) return -0.1;
  return 0;
}

async function fetchApeWisdomPage(page: number): Promise<ApeWisdomRow[]> {
  const url = `https://apewisdom.io/api/v1.0/filter/all-stocks/page/${page}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as ApeWisdomResponse;
  return data.results ?? [];
}

export async function fetchAllApeWisdomRows(maxPages = 50): Promise<ApeWisdomRow[]> {
  const all: ApeWisdomRow[] = [];
  const seen = new Set<string>();
  const batchSize = 5;

  for (let start = 1; start <= maxPages; start += batchSize) {
    const pageNums = Array.from({ length: batchSize }, (_, i) => start + i).filter(
      (p) => p <= maxPages
    );
    const pages = await Promise.all(pageNums.map((p) => fetchApeWisdomPage(p)));

    let hitEnd = false;
    for (const rows of pages) {
      if (!rows.length) {
        hitEnd = true;
        break;
      }
      for (const row of rows) {
        const ticker = row.ticker.toUpperCase();
        if (seen.has(ticker)) continue;
        seen.add(ticker);
        all.push({ ...row, ticker });
      }
      if (rows.length < 10) hitEnd = true;
    }
    if (hitEnd) break;
  }

  return all;
}

export async function fetchApeWisdomMention(symbol: string): Promise<SentimentMention[]> {
  try {
    const rows = await fetchAllApeWisdomRows(5);
    const row = rows.find((r) => r.ticker.toUpperCase() === symbol.toUpperCase());
    if (!row) return [];

    const score = mentionVelocityScore(row.mentions, row.mentions_24h_ago);
    return [
      {
        id: `apewisdom-${symbol}-${row.rank}`,
        source: "apewisdom",
        title: `${symbol} — #${row.rank} on ApeWisdom (${row.mentions} Reddit mentions)`,
        summary: `${row.name}: ${row.mentions} mentions (${row.mentions_24h_ago} 24h ago), ${row.upvotes} upvotes`,
        url: "https://apewisdom.io/",
        publishedAt: new Date().toISOString(),
        score,
        label: labelFromScore(score),
        meta: {
          mentions: row.mentions,
          rank: row.rank,
          upvotes: row.upvotes,
        },
      },
    ];
  } catch {
    return [];
  }
}

export async function fetchApeWisdomTopTickers(limit = 25): Promise<string[]> {
  const rows = await fetchAllApeWisdomRows(Math.ceil(limit / 10) + 1);
  return rows.slice(0, limit).map((r) => r.ticker.toUpperCase());
}
