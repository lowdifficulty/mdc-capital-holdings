import { fetchCnbc, fetchFinnhubNews, fetchGoogleNews, fetchMarketWatch } from "./news";
import { fetchRedditMentions } from "./reddit";
import { labelFromScore } from "./lexicon";
import type {
  SentimentMention,
  SentimentReport,
  SentimentSource,
  SourceBreakdown,
} from "./types";

const SOURCE_LABELS: Record<SentimentSource, string> = {
  finnhub: "Finnhub / wire headlines",
  google_news: "Google News (major outlets)",
  cnbc: "CNBC",
  marketwatch: "MarketWatch",
  reddit: "Reddit discussions",
};

function aggregateSources(mentions: SentimentMention[]): SourceBreakdown[] {
  const buckets = new Map<SentimentSource, SentimentMention[]>();

  for (const mention of mentions) {
    const list = buckets.get(mention.source) ?? [];
    list.push(mention);
    buckets.set(mention.source, list);
  }

  return Array.from(buckets.entries())
    .map(([source, items]) => {
      const averageScore =
        items.reduce((sum, item) => sum + item.score, 0) / Math.max(items.length, 1);
      return {
        source,
        label: SOURCE_LABELS[source],
        count: items.length,
        averageScore,
        labelSummary: labelFromScore(averageScore),
      };
    })
    .sort((a, b) => b.count - a.count);
}

export async function analyzeStockSentiment(symbol: string): Promise<SentimentReport> {
  const ticker = symbol.trim().toUpperCase().replace(/[^A-Z.]/g, "");
  const warnings: string[] = [];

  if (!ticker || ticker.length > 6) {
    return {
      symbol: ticker || "?",
      analyzedAt: new Date().toISOString(),
      overallScore: 0,
      overallLabel: "neutral",
      mentionCount: 0,
      sources: [],
      mentions: [],
      warnings: ["Enter a valid stock ticker (e.g. AAPL, MSFT, TSLA)."],
    };
  }

  if (!process.env.FINNHUB_API_KEY) {
    warnings.push(
      "FINNHUB_API_KEY is not set — Finnhub headlines are skipped. Add it in Vercel env for broader news coverage."
    );
  }

  const [google, cnbc, marketwatch, finnhub, reddit] = await Promise.all([
    fetchGoogleNews(ticker),
    fetchCnbc(ticker),
    fetchMarketWatch(ticker),
    fetchFinnhubNews(ticker),
    fetchRedditMentions(ticker),
  ]);

  const mentions = [...google, ...cnbc, ...marketwatch, ...finnhub, ...reddit].sort(
    (a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")
  );

  if (!mentions.length) {
    warnings.push(
      "No recent mentions found. Try a more active ticker or check again in a few minutes."
    );
  }

  const overallScore =
    mentions.reduce((sum, m) => sum + m.score, 0) / Math.max(mentions.length, 1);

  return {
    symbol: ticker,
    analyzedAt: new Date().toISOString(),
    overallScore,
    overallLabel: labelFromScore(overallScore),
    mentionCount: mentions.length,
    sources: aggregateSources(mentions),
    mentions: mentions.slice(0, 60),
    warnings,
  };
}
