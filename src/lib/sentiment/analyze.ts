import { fetchAllApeWisdomRows, fetchApeWisdomMention } from "./apewisdom";
import { fetchAlphaVantageNews } from "./alphaVantage";
import { fetchFinnhubSocial } from "./finnhubSocial";
import { fetchNewsApi } from "./newsApi";
import { fetchOptionsFlow } from "./optionsFlow";
import { labelFromScore } from "./lexicon";
import { buildSocialMover } from "./movers";
import { fetchBulkPriceSnapshots, fetchPriceSnapshot } from "./prices";
import { buildSourceMatrix } from "./sourceMatrix";
import {
  fetchCnbc,
  fetchFinnhubNews,
  fetchGoogleNews,
  fetchMarketWatch,
  fetchNasdaqNews,
  fetchSeekingAlpha,
  fetchYahooFinance,
} from "./news";
import { fetchRedditMentions } from "./reddit";
import { fetchStocktwits } from "./stocktwits";
import { fetchSwaggyStocks, fetchAllSwaggyRows } from "./swaggystocks";
import { fetchTwitterSentiment } from "./twitter";
import type {
  MoversReport,
  SentimentMention,
  SentimentMover,
  SentimentPeriod,
  SentimentReport,
  SentimentSource,
  SourceBreakdown,
} from "./types";
import {
  filterMentionsBetweenDays,
  filterMentionsBetweenHours,
  filterMentionsByDays,
  filterMentionsByHours,
  weightedAverageScore,
} from "./utils";

const SOURCE_LABELS: Record<SentimentSource, string> = {
  finnhub: "Finnhub wire headlines",
  finnhub_social: "Finnhub Reddit social",
  google_news: "Google News",
  cnbc: "CNBC",
  marketwatch: "MarketWatch",
  yahoo_finance: "Yahoo Finance",
  nasdaq: "Nasdaq",
  seeking_alpha: "Seeking Alpha",
  reddit: "Reddit (6 subreddits)",
  stocktwits: "Stocktwits",
  apewisdom: "ApeWisdom Reddit tracker",
  alpha_vantage: "Alpha Vantage news sentiment",
  swaggystocks: "SwaggyStocks WSB",
  twitter: "X (Twitter) via Finnhub",
  news_api: "NewsAPI (broad news)",
  options_flow: "Options put/call flow",
};

const DEFAULT_UNIVERSE = [
  "AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL",
  "AMD", "PLTR", "GME", "AMC", "SOFI", "COIN", "MARA",
];

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

function buildWarnings(): string[] {
  const warnings: string[] = [];
  if (!process.env.FINNHUB_API_KEY) {
    warnings.push(
      "FINNHUB_API_KEY not set — Finnhub headlines, Reddit social, and X (Twitter) sentiment skipped."
    );
  }
  if (!process.env.NEWS_API_KEY) {
    warnings.push(
      "NEWS_API_KEY not set — NewsAPI broad news coverage skipped. Free tier at newsapi.org."
    );
  }
  if (!process.env.ALPHA_VANTAGE_API_KEY) {
    warnings.push(
      "ALPHA_VANTAGE_API_KEY not set — Alpha Vantage ticker news sentiment skipped. Free tier available at alphavantage.co."
    );
  }
  return warnings;
}

export async function fetchAllMentions(symbol: string): Promise<SentimentMention[]> {
  const [
    google,
    cnbc,
    marketwatch,
    yahoo,
    nasdaq,
    seekingAlpha,
    finnhub,
    finnhubSocial,
    reddit,
    stocktwits,
    apewisdom,
    swaggystocks,
    alphaVantage,
    twitter,
    newsApi,
    optionsFlow,
  ] = await Promise.all([
    fetchGoogleNews(symbol),
    fetchCnbc(symbol),
    fetchMarketWatch(symbol),
    fetchYahooFinance(symbol),
    fetchNasdaqNews(symbol),
    fetchSeekingAlpha(symbol),
    fetchFinnhubNews(symbol, 30),
    fetchFinnhubSocial(symbol, 30),
    fetchRedditMentions(symbol),
    fetchStocktwits(symbol),
    fetchApeWisdomMention(symbol),
    fetchSwaggyStocks(symbol),
    fetchAlphaVantageNews(symbol),
    fetchTwitterSentiment(symbol, 30),
    fetchNewsApi(symbol),
    fetchOptionsFlow(symbol),
  ]);

  return [
    ...google,
    ...cnbc,
    ...marketwatch,
    ...yahoo,
    ...nasdaq,
    ...seekingAlpha,
    ...finnhub,
    ...finnhubSocial,
    ...reddit,
    ...stocktwits,
    ...apewisdom,
    ...swaggystocks,
    ...alphaVantage,
    ...twitter,
    ...newsApi,
    ...optionsFlow,
  ].sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}

function computeVelocity(
  periodMentions: SentimentMention[],
  priorMentions: SentimentMention[],
  period: SentimentPeriod = "week"
) {
  const weekScore = weightedAverageScore(periodMentions);
  const priorScore = weightedAverageScore(priorMentions);
  const velocity = weekScore - priorScore;

  const periodCount = periodMentions.length;
  const priorCount = priorMentions.length;

  let mentionVelocity: number;
  if (period === "24h") {
    mentionVelocity =
      priorCount > 0 ? (periodCount - priorCount) / priorCount : periodCount > 0 ? 1 : 0;
  } else if (period === "week") {
    const expectedFromPrior = priorCount > 0 ? (priorCount / 23) * 7 : 0;
    mentionVelocity =
      expectedFromPrior > 0
        ? (periodCount - expectedFromPrior) / expectedFromPrior
        : periodCount > 0
          ? 1
          : 0;
  } else {
    mentionVelocity =
      priorCount > 0 ? (periodCount - priorCount) / priorCount : periodCount > 0 ? 1 : 0;
  }

  return {
    weekScore,
    priorScore,
    velocity,
    mentionVelocity,
    weekCount: periodCount,
    priorCount,
  };
}

export async function analyzeStockSentiment(
  symbol: string,
  period: SentimentPeriod = "week"
): Promise<SentimentReport> {
  const ticker = symbol.trim().toUpperCase().replace(/[^A-Z.]/g, "");
  const warnings = buildWarnings();
  const analyzedAt = new Date().toISOString();

  if (!ticker || ticker.length > 6) {
    return {
      symbol: ticker || "?",
      analyzedAt,
      period,
      overallScore: 0,
      overallLabel: "neutral",
      mentionCount: 0,
      sources: [],
      sourceMatrix: [],
      mentions: [],
      warnings: ["Enter a valid stock ticker (e.g. AAPL, MSFT, TSLA)."],
    };
  }

  const [allMentions, price] = await Promise.all([
    fetchAllMentions(ticker),
    fetchPriceSnapshot(ticker),
  ]);

  const h24Mentions = filterMentionsByHours(allMentions, 24);
  const weekMentions = filterMentionsByDays(allMentions, 7);
  const monthMentions = filterMentionsByDays(allMentions, 30);

  const periodMentions =
    period === "24h"
      ? h24Mentions
      : period === "week"
        ? weekMentions
        : monthMentions;

  const priorMentions =
    period === "24h"
      ? filterMentionsBetweenHours(allMentions, 48, 24)
      : period === "week"
        ? filterMentionsBetweenDays(allMentions, 30, 7)
        : filterMentionsBetweenDays(allMentions, 60, 30);

  const periodLabel =
    period === "24h" ? "24 hours" : period === "week" ? "7 days" : "30 days";

  if (!periodMentions.length) {
    warnings.push(
      `No mentions in the last ${periodLabel}. Try a more active ticker or add API keys for broader coverage.`
    );
  }

  const overallScore = weightedAverageScore(periodMentions);
  const { priorScore, velocity, mentionVelocity } = computeVelocity(
    periodMentions,
    priorMentions,
    period
  );
  const h24Sources = aggregateSources(h24Mentions);
  const weekSources = aggregateSources(weekMentions);
  const monthSources = aggregateSources(monthMentions);
  const sourceMatrix = buildSourceMatrix(h24Sources, weekSources, monthSources, SOURCE_LABELS);

  return {
    symbol: ticker,
    analyzedAt,
    period,
    overallScore,
    overallLabel: labelFromScore(overallScore),
    mentionCount: periodMentions.length,
    sources: aggregateSources(periodMentions),
    sourceMatrix,
    mentions: periodMentions.slice(0, 80),
    warnings,
    price: price ?? undefined,
    comparison: {
      priorScore,
      priorLabel: labelFromScore(priorScore),
      priorMentionCount: priorMentions.length,
      velocity,
      mentionVelocity,
    },
  };
}

export async function analyzeMovers(): Promise<MoversReport> {
  const warnings: string[] = [];
  const analyzedAt = new Date().toISOString();

  const [apeRows, swaggyRows] = await Promise.all([
    fetchAllApeWisdomRows(),
    fetchAllSwaggyRows(),
  ]);

  const swaggyByTicker = new Map(swaggyRows.map((r) => [r.ticker, r]));
  const tickers = new Set<string>();

  for (const row of apeRows) tickers.add(row.ticker);
  for (const row of swaggyRows) tickers.add(row.ticker);
  for (const sym of DEFAULT_UNIVERSE) tickers.add(sym);

  const apeByTicker = new Map(apeRows.map((r) => [r.ticker, r]));

  const movers = Array.from(tickers)
    .map((symbol) => {
      const ape = apeByTicker.get(symbol);
      const swaggy = swaggyByTicker.get(symbol);
      return buildSocialMover(symbol, ape, swaggy);
    })
    .filter((m): m is SentimentMover => m !== null)
    .sort((a, b) => Math.abs(b.moverScore) - Math.abs(a.moverScore));

  const priceMap = await fetchBulkPriceSnapshots(movers.map((m) => m.symbol));
  const moversWithPrices = movers.map((m) => {
    const p = priceMap.get(m.symbol);
    if (!p) return m;
    return {
      ...m,
      price: p.price,
      dailyChange: p.dailyChange,
      weeklyChange: p.weeklyChange,
      monthlyChange: p.monthlyChange,
      tvSymbol: p.tvSymbol,
    };
  });

  if (!moversWithPrices.length) {
    warnings.push("No mover data found. ApeWisdom / SwaggyStocks may be unreachable.");
  } else {
    warnings.push(
      `Scanned ${moversWithPrices.length} tickers across ApeWisdom (${apeRows.length}) + SwaggyStocks (${swaggyRows.length}). Prices from Yahoo Finance. Click a row to expand the live chart.`
    );
  }

  return {
    analyzedAt,
    movers: moversWithPrices,
    totalAnalyzed: moversWithPrices.length,
    warnings,
  };
}
