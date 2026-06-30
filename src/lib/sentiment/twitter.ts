import type { SentimentMention } from "./types";
import { labelFromScore } from "./lexicon";
import { isoDaysAgo } from "./utils";

interface FinnhubSocialRow {
  atTime: string;
  mention: number;
  positiveScore: number;
  negativeScore: number;
  positiveMention: number;
  negativeMention: number;
  score: number;
}

/** X (Twitter) sentiment via Finnhub social-sentiment API. */
export async function fetchTwitterSentiment(
  symbol: string,
  days = 30
): Promise<SentimentMention[]> {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) return [];

  const from = isoDaysAgo(days);
  const to = isoDaysAgo(0);
  const url = `https://finnhub.io/api/v1/stock/social-sentiment?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}&token=${token}`;

  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return [];

    const data = (await res.json()) as { twitter?: FinnhubSocialRow[] };
    const rows = data.twitter ?? [];

    return rows.slice(-14).map((row) => {
      const score = Math.max(-1, Math.min(1, row.score ?? 0));
      return {
        id: `twitter-${row.atTime}`,
        source: "twitter" as const,
        title: `${symbol} on X — ${row.mention} mentions`,
        summary: `Positive: ${row.positiveMention}, Negative: ${row.negativeMention}, Score: ${score.toFixed(2)}`,
        publishedAt: new Date(row.atTime).toISOString(),
        score,
        label: labelFromScore(score),
        meta: { mentions: row.mention },
      };
    });
  } catch {
    return [];
  }
}
