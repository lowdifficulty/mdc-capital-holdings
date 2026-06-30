/** Configurable dataset weights for unified sentiment (sum ≈ 1). */
export const DATASET_WEIGHTS: Record<string, number> = {
  congress_trades: 0.22,
  insider_trades: 0.16,
  hedge_fund_activity: 0.12,
  government_contracts: 0.1,
  corporate_lobbying: 0.07,
  corporate_donors: 0.03,
  patents: 0.06,
  executive_compensation: 0.03,
  top_shareholders: 0.05,
  off_exchange_short_volume: 0.08,
  newsfeed: 0.08,
  social: 0.05,
};

export function defaultLookbackDays(): number {
  const v = Number(process.env.DEFAULT_LOOKBACK_DAYS);
  return Number.isFinite(v) && v > 0 ? v : 90;
}

export function refreshIntervalHours(): number {
  const v = Number(process.env.ANALYSIS_REFRESH_INTERVAL_HOURS);
  return Number.isFinite(v) && v > 0 ? v : 12;
}

export const RECOMMENDATION_THRESHOLDS = {
  strongBullish: { sentiment: 70, maxRisk: 50 },
  bullish: 45,
  slightlyBullish: 20,
  bearish: -45,
  strongBearish: -70,
  cautionMinSentiment: 20,
  cautionMinRisk: 70,
} as const;
