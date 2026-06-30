import type { FinalSignal, WarningFlag } from "@/lib/intelligence/types";

export function signalColor(signal: FinalSignal): string {
  switch (signal) {
    case "Strong Buy":
      return "bg-emerald-500/20 border-emerald-400/40 text-emerald-300";
    case "Buy":
      return "bg-emerald-500/10 border-emerald-400/30 text-emerald-400";
    case "Watch":
      return "bg-amber-500/15 border-amber-400/30 text-amber-300";
    case "Avoid":
      return "bg-red-500/15 border-red-400/30 text-red-300";
    case "Short-Candidate":
      return "bg-orange-500/15 border-orange-400/30 text-orange-300";
  }
}

export function scoreBarColor(score: number): string {
  if (score >= 65) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-400";
  if (score >= 35) return "bg-orange-400";
  return "bg-red-500";
}

export function signedScoreColor(score: number): string {
  if (score > 20) return "text-emerald-400";
  if (score < -20) return "text-red-400";
  return "text-amber-300";
}

export function formatSignedScore(score: number): string {
  const sign = score > 0 ? "+" : "";
  return `${sign}${score}`;
}

export function formatUsd(n: number): string {
  return n >= 1000 ? `$${n.toFixed(0)}` : `$${n.toFixed(2)}`;
}

export function formatPct(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export const WARNING_LABELS: Record<WarningFlag, string> = {
  low_volume: "Low volume",
  high_volatility: "High volatility",
  weak_sentiment: "Weak sentiment",
  earnings_risk: "Earnings risk",
  spread_risk: "Spread risk",
  overextended_chart: "Overextended chart",
  sentiment_divergence: "Sentiment divergence",
  reversal_candidate: "Reversal candidate",
  illiquid: "Illiquid",
  poor_value_risk: "Poor value-to-risk",
};
