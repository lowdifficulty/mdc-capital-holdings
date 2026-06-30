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

export async function fetchFinnhubSocial(
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

    const data = (await res.json()) as { reddit?: FinnhubSocialRow[]; twitter?: FinnhubSocialRow[] };
    const mentions: SentimentMention[] = [];

    for (const [platform, rows] of Object.entries(data)) {
      if (!Array.isArray(rows)) continue;
      for (const row of rows.slice(-14)) {
        const score = Math.max(-1, Math.min(1, row.score ?? 0));
        mentions.push({
          id: `finnhub_social-${platform}-${row.atTime}`,
          source: "finnhub_social",
          title: `${symbol} ${platform} sentiment — ${row.mention} mentions`,
          summary: `Positive: ${row.positiveMention}, Negative: ${row.negativeMention}, Score: ${score.toFixed(2)}`,
          publishedAt: new Date(row.atTime).toISOString(),
          score,
          label: labelFromScore(score),
          meta: { mentions: row.mention, platform: platform as string },
        });
      }
    }

    return mentions;
  } catch {
    return [];
  }
}
