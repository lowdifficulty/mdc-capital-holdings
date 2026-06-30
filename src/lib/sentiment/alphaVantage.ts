import type { SentimentMention } from "./types";
import { labelFromScore } from "./lexicon";

interface AvNewsItem {
  title: string;
  url: string;
  time_published: string;
  summary: string;
  overall_sentiment_score?: number;
  overall_sentiment_label?: string;
  ticker_sentiment?: Array<{
    ticker: string;
    relevance_score?: string;
    ticker_sentiment_score?: string;
    ticker_sentiment_label?: string;
  }>;
}

interface AvResponse {
  feed?: AvNewsItem[];
  Note?: string;
}

export async function fetchAlphaVantageNews(symbol: string): Promise<SentimentMention[]> {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) return [];

  const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${encodeURIComponent(symbol)}&limit=50&apikey=${key}`;

  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return [];

    const data = (await res.json()) as AvResponse;
    if (data.Note) return [];

    const feed = data.feed ?? [];
    const upper = symbol.toUpperCase();

    return feed
      .filter((item) =>
        item.ticker_sentiment?.some((t) => t.ticker.toUpperCase() === upper)
      )
      .slice(0, 25)
      .map((item, i) => {
        const tickerRow = item.ticker_sentiment?.find(
          (t) => t.ticker.toUpperCase() === upper
        );
        const score =
          tickerRow?.ticker_sentiment_score != null
            ? parseFloat(tickerRow.ticker_sentiment_score)
            : (item.overall_sentiment_score ?? 0);

        const clamped = Math.max(-1, Math.min(1, score));

        const published = item.time_published;
        const iso = published
          ? `${published.slice(0, 4)}-${published.slice(4, 6)}-${published.slice(6, 8)}T${published.slice(9, 11)}:${published.slice(11, 13)}:00Z`
          : undefined;

        return {
          id: `alpha_vantage-${i}-${published}`,
          source: "alpha_vantage" as const,
          title: item.title,
          summary: item.summary?.slice(0, 280),
          url: item.url,
          publishedAt: iso,
          score: clamped,
          label: labelFromScore(clamped),
        };
      });
  } catch {
    return [];
  }
}
