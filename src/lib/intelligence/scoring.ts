import type {
  FinalSignal,
  IntelligenceSettings,
  SentimentSnapshot,
  StrategyMatch,
  TechnicalSnapshot,
  TimeHorizon,
  ValueRiskPlan,
  WarningFlag,
} from "./types";

function toScore100(normalized: number): number {
  return Math.round(Math.max(-100, Math.min(100, normalized * 100)));
}

export function scoreSentiment(s: SentimentSnapshot): number {
  let score = s.scoreWeek * 0.5 + s.scoreMonth * 0.3 + s.score24h * 0.2;
  if (s.scoreWeek > 0 && s.scoreMonth > 0) score += 15;
  if (s.scoreWeek < 0 && s.scoreMonth < 0) score -= 15;
  if (s.velocity > 10) score += 10;
  if (s.velocity < -10) score -= 10;
  return Math.max(-100, Math.min(100, Math.round(score)));
}

export function scoreTechnical(tech: TechnicalSnapshot): number {
  let pts = 0;
  if (tech.price > tech.vwap) pts += 15;
  if (tech.price > tech.ema9) pts += 10;
  if (tech.price > tech.ema20) pts += 10;
  if (tech.price > tech.sma50) pts += 15;
  if (tech.ema9 > tech.ema20) pts += 15;
  if (tech.sma50 > tech.sma200) pts += 10;
  if (tech.macd.histogram > 0) pts += 10;
  if (tech.price < tech.vwap) pts -= 15;
  if (tech.ema9 < tech.ema20) pts -= 15;
  if (tech.price < tech.sma50) pts -= 15;
  if (tech.rsi14 > 75) pts -= 10;
  if (tech.rsi14 < 30) pts += 5;
  return Math.max(-100, Math.min(100, pts));
}

export function scoreMomentum(tech: TechnicalSnapshot): number {
  let pts = 0;
  pts += Math.max(-30, Math.min(30, tech.return1d * 3));
  pts += Math.max(-25, Math.min(25, tech.return5d * 2));
  pts += Math.max(-20, Math.min(20, tech.return20d));
  if (tech.relativeVolume >= 1.5) pts += 15;
  if (tech.relativeVolume >= 1.2) pts += 8;
  if (tech.relativeVolume < 0.7) pts -= 20;
  return Math.max(-100, Math.min(100, Math.round(pts)));
}

export function scoreValueRisk(vr: ValueRiskPlan): number {
  if (vr.valueToRiskRatio >= 3) return 90;
  if (vr.valueToRiskRatio >= 2) return 75;
  if (vr.valueToRiskRatio >= 1.5) return 55;
  if (vr.valueToRiskRatio >= 1) return 30;
  return 10;
}

export function detectWarnings(
  tech: TechnicalSnapshot,
  sentiment: SentimentSnapshot,
  vr: ValueRiskPlan
): WarningFlag[] {
  const w: WarningFlag[] = [];
  if (tech.relativeVolume < 0.7) w.push("low_volume", "illiquid");
  if (tech.atr14 / tech.price > 0.045) w.push("high_volatility");
  if (sentiment.scoreWeek < -20) w.push("weak_sentiment");
  if (tech.rsi14 > 75) w.push("overextended_chart");
  if (tech.return5d > 2 && sentiment.velocity < -5) w.push("sentiment_divergence");
  if (tech.return5d < -2 && sentiment.velocity > 5) w.push("reversal_candidate");
  if (vr.valueToRiskRatio < 1.5) w.push("poor_value_risk");
  return [...new Set(w)];
}

export function riskPenalty(warnings: WarningFlag[]): number {
  let penalty = 0;
  for (const flag of warnings) {
    if (flag === "high_volatility") penalty += 8;
    else if (flag === "illiquid" || flag === "low_volume") penalty += 12;
    else if (flag === "poor_value_risk") penalty += 15;
    else if (flag === "sentiment_divergence") penalty += 10;
    else penalty += 5;
  }
  return Math.min(30, penalty);
}

export function deriveSignal(
  composite: number,
  sentimentScore: number,
  technicalScore: number,
  vr: ValueRiskPlan,
  strategies: StrategyMatch[]
): FinalSignal {
  const bearishStrats = strategies.filter((s) => s.bias === "bearish").length;
  const bullishStrats = strategies.filter((s) => s.bias === "bullish").length;

  if (
    composite < 45 &&
    sentimentScore < -15 &&
    technicalScore < -10 &&
    bearishStrats >= 2 &&
    vr.valueToRiskRatio >= 1.5
  ) {
    return "Short-Candidate";
  }
  if (composite >= 80 && sentimentScore > 10 && technicalScore > 10 && vr.valueToRiskRatio >= 2) {
    return "Strong Buy";
  }
  if (composite >= 65 && vr.valueToRiskRatio >= 1.5) return "Buy";
  if (composite >= 50) return "Watch";
  return "Avoid";
}

export function deriveTimeHorizon(
  tech: TechnicalSnapshot,
  strategies: StrategyMatch[],
  settings: IntelligenceSettings
): TimeHorizon {
  if (settings.timeHorizon !== "swing") return settings.timeHorizon;
  const intraday = strategies.some((s) =>
    ["opening_range_breakout", "gap_and_go", "gap_fade", "vwap_reversion"].includes(s.id)
  );
  if (intraday && tech.atr14 / tech.price < 0.03) return "intraday";
  if (tech.return20d > 10 && tech.sma50 > tech.sma200) return "position";
  return "swing";
}

export function computeComposite(
  sentimentScore: number,
  technicalScore: number,
  momentumScore: number,
  valueRiskScore: number,
  penalty: number,
  settings: IntelligenceSettings
): number {
  const w = settings.weights;
  const raw =
    ((sentimentScore + 100) / 2) * w.sentiment +
    ((technicalScore + 100) / 2) * w.technical +
    ((momentumScore + 100) / 2) * w.momentum +
    (valueRiskScore / 100) * 100 * w.valueRisk;
  const totalW = w.sentiment + w.technical + w.momentum + w.valueRisk;
  return Math.max(0, Math.min(100, Math.round(raw / totalW - penalty)));
}
