import type { SentimentMention } from "./types";
import { labelFromScore, scoreText } from "./lexicon";

const UA = "MDC-Capital-Sentiment/1.0";

interface StocktwitsMessage {
  id: number;
  body: string;
  created_at: string;
  entities?: { sentiment?: { basic?: string } };
  user?: { username?: string };
}

interface StocktwitsResponse {
  messages?: StocktwitsMessage[];
}

export async function fetchStocktwits(symbol: string): Promise<SentimentMention[]> {
  const url = `https://api.stocktwits.com/api/2/streams/symbol/${encodeURIComponent(symbol)}.json`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as StocktwitsResponse;
    const messages = data.messages ?? [];

    return messages.slice(0, 30).map((msg) => {
      const basic = msg.entities?.sentiment?.basic;
      let score = scoreText(msg.body);
      if (basic === "Bullish") score = Math.max(score, 0.35);
      if (basic === "Bearish") score = Math.min(score, -0.35);

      return {
        id: `stocktwits-${msg.id}`,
        source: "stocktwits" as const,
        title: msg.user?.username ? `@${msg.user.username}: ${msg.body.slice(0, 120)}` : msg.body.slice(0, 140),
        summary: msg.body.length > 120 ? msg.body : undefined,
        url: `https://stocktwits.com/symbol/${symbol}`,
        publishedAt: new Date(msg.created_at).toISOString(),
        score,
        label: labelFromScore(score),
      };
    });
  } catch {
    return [];
  }
}
