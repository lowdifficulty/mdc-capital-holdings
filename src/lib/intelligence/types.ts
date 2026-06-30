export type FinalSignal =
  | "Strong Buy"
  | "Buy"
  | "Watch"
  | "Avoid"
  | "Short-Candidate";

export type TimeHorizon = "intraday" | "swing" | "position";

export type StrategyBias = "bullish" | "bearish" | "neutral" | "watch";

export type WarningFlag =
  | "low_volume"
  | "high_volatility"
  | "weak_sentiment"
  | "earnings_risk"
  | "spread_risk"
  | "overextended_chart"
  | "sentiment_divergence"
  | "reversal_candidate"
  | "illiquid"
  | "poor_value_risk";

export interface OHLCVBar {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface TechnicalSnapshot {
  price: number;
  vwap: number;
  ema9: number;
  ema20: number;
  sma50: number;
  sma200: number;
  rsi14: number;
  macd: { line: number; signal: number; histogram: number };
  bollinger: { upper: number; middle: number; lower: number };
  atr14: number;
  relativeVolume: number;
  premarketGapPct: number;
  openingRangeHigh: number;
  openingRangeLow: number;
  distanceFrom52wHighPct: number;
  distanceFrom52wLowPct: number;
  return1d: number;
  return5d: number;
  return20d: number;
}

export interface StrategyMatch {
  id: string;
  name: string;
  bias: StrategyBias;
  strength: number;
  description: string;
}

export interface ValueRiskPlan {
  entryLow: number;
  entryHigh: number;
  stopLoss: number;
  upsideTarget: number;
  downsideRisk: number;
  upsideValue: number;
  valueToRiskRatio: number;
  interpretation: string;
}

export interface SentimentSnapshot {
  score24h: number;
  scoreWeek: number;
  scoreMonth: number;
  velocity: number;
  mentionVelocity: number;
  mentionCount: number;
}

export interface Recommendation {
  symbol: string;
  name?: string;
  analyzedAt: string;
  signal: FinalSignal;
  confidence: number;
  sentimentScore: number;
  technicalScore: number;
  momentumScore: number;
  riskScore: number;
  compositeScore: number;
  valueRisk: ValueRiskPlan;
  timeHorizon: TimeHorizon;
  strategies: StrategyMatch[];
  warnings: WarningFlag[];
  explanation: string;
  sentiment: SentimentSnapshot;
  technical: TechnicalSnapshot;
  price: number;
  dailyChangePct: number;
}

export interface ScanFilters {
  signal?: FinalSignal[];
  minConfidence?: number;
  minValueRisk?: number;
  strategyId?: string;
  bias?: "bullish" | "bearish" | "watch";
}

export interface IntelligenceSettings {
  riskTolerance: "conservative" | "balanced" | "aggressive";
  minVolume: number;
  minValueRisk: number;
  timeHorizon: TimeHorizon;
  paperTradingMode: boolean;
  weights: {
    sentiment: number;
    technical: number;
    momentum: number;
    valueRisk: number;
  };
}

export const DEFAULT_SETTINGS: IntelligenceSettings = {
  riskTolerance: "balanced",
  minVolume: 500_000,
  minValueRisk: 1.5,
  timeHorizon: "swing",
  paperTradingMode: false,
  weights: {
    sentiment: 0.3,
    technical: 0.3,
    momentum: 0.2,
    valueRisk: 0.15,
  },
};

export const DEFAULT_UNIVERSE = [
  "AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL",
  "AMD", "PLTR", "SPY", "QQQ", "IWM", "JPM", "BAC", "XOM",
  "COIN", "SOFI", "GME", "MARA", "NFLX",
];
