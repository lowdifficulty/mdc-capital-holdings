export type SentimentLabel = "bullish" | "bearish" | "neutral";

export type SentimentSource =
  | "finnhub"
  | "google_news"
  | "reddit"
  | "cnbc"
  | "marketwatch";

export interface SentimentMention {
  id: string;
  source: SentimentSource;
  title: string;
  summary?: string;
  url?: string;
  publishedAt?: string;
  score: number;
  label: SentimentLabel;
}

export interface SourceBreakdown {
  source: SentimentSource;
  label: string;
  count: number;
  averageScore: number;
  labelSummary: SentimentLabel;
}

export interface SentimentReport {
  symbol: string;
  companyName?: string;
  analyzedAt: string;
  overallScore: number;
  overallLabel: SentimentLabel;
  mentionCount: number;
  sources: SourceBreakdown[];
  mentions: SentimentMention[];
  warnings: string[];
}
