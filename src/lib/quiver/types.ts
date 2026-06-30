export type QuiverDataset =
  | "congress_trades"
  | "senate_trades"
  | "house_trades"
  | "insider_trades"
  | "hedge_fund_activity"
  | "government_contracts"
  | "corporate_lobbying"
  | "corporate_donors"
  | "patents"
  | "executive_compensation"
  | "top_shareholders"
  | "off_exchange_short_volume"
  | "newsfeed"
  | "social";

export type ActorType =
  | "politician"
  | "insider"
  | "fund"
  | "agency"
  | "company"
  | "news"
  | "social"
  | "unknown";

export interface QuiverRawEvent {
  id: string;
  uniqueHash: string;
  sourceDataset: QuiverDataset;
  ticker: string;
  companyName?: string;
  eventDate?: string;
  filedDate?: string;
  actorName?: string;
  actorType: ActorType;
  transactionType?: string;
  rawAmount?: string;
  amountMin?: number;
  amountMax?: number;
  amountEstimate?: number;
  party?: string;
  chamber?: string;
  description?: string;
  rawPayload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TickerSignalScore {
  id: string;
  ticker: string;
  signalDate: string;
  sourceDataset: QuiverDataset;
  signalName: string;
  rawValue?: number;
  normalizedValue?: number;
  sentimentScore: number;
  confidenceScore: number;
  weight: number;
  explanation: string;
  lookbackWindowDays: number;
  createdAt: string;
}

export interface DatasetScores {
  congress_score: number;
  insider_score: number;
  hedge_fund_score: number;
  gov_contract_score: number;
  lobbying_score: number;
  donor_score: number;
  patent_score: number;
  off_exchange_score: number;
  news_score: number;
  social_score: number;
  executive_compensation_score: number;
  top_shareholder_score: number;
}

export type RecommendationLabel =
  | "Strong Bullish"
  | "Bullish"
  | "Slightly Bullish"
  | "Neutral"
  | "Caution"
  | "Bearish"
  | "Strong Bearish";

export interface TickerDailyScore extends DatasetScores {
  id: string;
  ticker: string;
  scoreDate: string;
  total_sentiment_score: number;
  risk_score: number;
  value_to_risk_score: number;
  recommendation: RecommendationLabel;
  confidence_score: number;
  explanation: {
    summary: string;
    drivers: string[];
    risks: string[];
    datasetBreakdown: Array<{
      dataset: string;
      score: number;
      confidence: number;
      weight: number;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisRun {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: "running" | "completed" | "failed";
  datasetsProcessed: string[];
  tickersProcessed: string[];
  errors: string[];
  notes?: string;
}

export interface QuiverStoreData {
  version: 1;
  events: QuiverRawEvent[];
  signalScores: TickerSignalScore[];
  dailyScores: Record<string, TickerDailyScore>;
  runs: AnalysisRun[];
  lastSyncAt?: string;
}

export interface CongressCluster {
  ticker: string;
  direction: "buy" | "sell";
  count: number;
  windowDays: number;
  politicians: string[];
  avgSentiment: number;
}
