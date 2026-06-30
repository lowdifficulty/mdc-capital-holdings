/** Display helpers — numeric sentiment only, no bullish/bearish labels. */

const SCORE_GREEN_MIN = 0.12;

export type MoverAnalysisColumns = {
  dailyChange?: number;
  weeklyChange?: number;
  monthlyChange?: number;
  h24Score: number;
  weekScore: number;
  monthScore: number;
};

export function isScoreGreen(score: number): boolean {
  return score >= SCORE_GREEN_MIN;
}

export function isPctGreen(pct?: number): boolean {
  return pct != null && pct > 0;
}

export function countGreenColumns(m: MoverAnalysisColumns): number {
  return [
    isPctGreen(m.dailyChange),
    isPctGreen(m.weeklyChange),
    isPctGreen(m.monthlyChange),
    isScoreGreen(m.h24Score),
    isScoreGreen(m.weekScore),
    isScoreGreen(m.monthScore),
  ].filter(Boolean).length;
}

export function isWinnerMover(m: MoverAnalysisColumns): boolean {
  return countGreenColumns(m) === 6;
}

export function isSecondPlaceMover(m: MoverAnalysisColumns): boolean {
  return countGreenColumns(m) === 5;
}

export function formatSentimentScore(score: number): string {
  const value = score * 100;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}`;
}

export function formatMentions(count: number): string {
  return count.toFixed(1);
}

export function scoreColor(score: number): string {
  if (isScoreGreen(score)) return "text-emerald-400 bg-emerald-400/15 border-emerald-400/30";
  if (score <= -0.12) return "text-red-400 bg-red-400/15 border-red-400/30";
  return "text-amber-300 bg-amber-400/15 border-amber-400/30";
}

export function scoreTextColor(score: number): string {
  if (isScoreGreen(score)) return "text-emerald-400";
  if (score <= -0.12) return "text-red-400";
  return "text-amber-300";
}
