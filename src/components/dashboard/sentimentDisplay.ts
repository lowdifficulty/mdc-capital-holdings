/** Display helpers — numeric sentiment only, no bullish/bearish labels. */

export function formatSentimentScore(score: number): string {
  const value = score * 100;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}`;
}

export function scoreColor(score: number): string {
  if (score >= 0.12) return "text-emerald-400 bg-emerald-400/15 border-emerald-400/30";
  if (score <= -0.12) return "text-red-400 bg-red-400/15 border-red-400/30";
  return "text-amber-300 bg-amber-400/15 border-amber-400/30";
}

export function scoreTextColor(score: number): string {
  if (score >= 0.12) return "text-emerald-400";
  if (score <= -0.12) return "text-red-400";
  return "text-amber-300";
}
