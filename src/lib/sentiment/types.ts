export type SentimentLabel = "bullish" | "bearish" | "neutral";

export type SentimentPeriod = "24h" | "week" | "month";

export type SentimentSource =
  | "finnhub"
  | "finnhub_social"
  | "google_news"
  | "reddit"
  | "cnbc"
  | "marketwatch"
  | "yahoo_finance"
  | "nasdaq"
  | "seeking_alpha"
  | "stocktwits"
  | "apewisdom"
  | "alpha_vantage"
  | "swaggystocks";

export interface SentimentMention {
  id: string;
  source: SentimentSource;
  title: string;
  summary?: string;
  url?: string;
  publishedAt?: string;
  score: number;
  label: SentimentLabel;
  meta?: Record<string, string | number>;
}

export interface SourceBreakdown {
  source: SentimentSource;
  label: string;
  count: number;
  averageScore: number;
  labelSummary: SentimentLabel;
}

export interface PeriodComparison {
  period: SentimentPeriod;
  days: number;
  overallScore: number;
  overallLabel: SentimentLabel;
  mentionCount: number;
  sources: SourceBreakdown[];
}

export interface PriceSnapshot {
  price: number;
  dailyChange: number;
  weeklyChange: number;
  monthlyChange: number;
}

export interface SourceMatrixRow {
  source: SentimentSource;
  label: string;
  h24: { score: number; label: SentimentLabel; count: number };
  week: { score: number; label: SentimentLabel; count: number };
  month: { score: number; label: SentimentLabel; count: number };
}

export interface SentimentReport {
  symbol: string;
  companyName?: string;
  analyzedAt: string;
  period: SentimentPeriod;
  overallScore: number;
  overallLabel: SentimentLabel;
  mentionCount: number;
  sources: SourceBreakdown[];
  sourceMatrix: SourceMatrixRow[];
  mentions: SentimentMention[];
  warnings: string[];
  price?: PriceSnapshot;
  comparison?: {
    priorScore: number;
    priorLabel: SentimentLabel;
    priorMentionCount: number;
    velocity: number;
    mentionVelocity: number;
  };
}

export interface SentimentMover {
  symbol: string;
  name?: string;
  rank?: number;
  h24Score: number;
  weekScore: number;
  monthScore: number;
  velocity: number;
  mentionVelocity: number;
  weekMentions: number;
  monthMentions: number;
  moverScore: number;
  direction: "heating_up" | "cooling_down" | "stable";
  price?: number;
  dailyChange?: number;
  weeklyChange?: number;
  monthlyChange?: number;
}

export interface MoversReport {
  analyzedAt: string;
  movers: SentimentMover[];
  totalAnalyzed: number;
  warnings: string[];
}
