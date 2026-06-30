export interface ForwardReturns {
  d1?: number;
  d5?: number;
  d10?: number;
  d30?: number;
  d90?: number;
}

export interface BacktestTrade {
  ticker: string;
  signalDate: string;
  sentiment: number;
  source: string;
  returns: ForwardReturns;
}

export interface BacktestSummary {
  tradeCount: number;
  winRate: Record<string, number>;
  avgReturn: Record<string, number>;
  medianReturn: Record<string, number>;
  sharpe: Record<string, number>;
  bySource: Record<string, { count: number; avgD30?: number }>;
  byBucket: Record<string, { count: number; avgD30?: number }>;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function sharpe(returns: number[]): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (returns.length - 1);
  const std = Math.sqrt(variance);
  return std > 0 ? (mean / std) * Math.sqrt(252) : 0;
}

export function summarizeBacktest(trades: BacktestTrade[]): BacktestSummary {
  const horizons = ["d1", "d5", "d10", "d30", "d90"] as const;
  const winRate: Record<string, number> = {};
  const avgReturn: Record<string, number> = {};
  const medianReturn: Record<string, number> = {};
  const sharpeByHorizon: Record<string, number> = {};

  for (const h of horizons) {
    const rets = trades.map((t) => t.returns[h]).filter((v): v is number => v != null);
    if (!rets.length) continue;
    winRate[h] = rets.filter((r) => r > 0).length / rets.length;
    avgReturn[h] = rets.reduce((a, b) => a + b, 0) / rets.length;
    medianReturn[h] = median(rets);
    sharpeByHorizon[h] = sharpe(rets);
  }

  const bySource: BacktestSummary["bySource"] = {};
  for (const t of trades) {
    const bucket = bySource[t.source] ?? { count: 0, avgD30: undefined };
    bucket.count++;
    if (t.returns.d30 != null) {
      const prev = bucket.avgD30 ?? 0;
      bucket.avgD30 = prev + (t.returns.d30 - prev) / bucket.count;
    }
    bySource[t.source] = bucket;
  }

  const byBucket: BacktestSummary["byBucket"] = {};
  for (const t of trades) {
    const label =
      t.sentiment >= 70
        ? "strong_bullish"
        : t.sentiment >= 45
          ? "bullish"
          : t.sentiment <= -70
            ? "strong_bearish"
            : t.sentiment <= -45
              ? "bearish"
              : "neutral";
    const bucket = byBucket[label] ?? { count: 0, avgD30: undefined };
    bucket.count++;
    if (t.returns.d30 != null) {
      const prev = bucket.avgD30 ?? 0;
      bucket.avgD30 = prev + (t.returns.d30 - prev) / bucket.count;
    }
    byBucket[label] = bucket;
  }

  return {
    tradeCount: trades.length,
    winRate,
    avgReturn,
    medianReturn,
    sharpe: sharpeByHorizon,
    bySource,
    byBucket,
  };
}
