import { analyzeStockSentiment } from "@/lib/sentiment/analyze";
import { fetchMarketData } from "./market-data";
import { buildTechnicalSnapshot } from "./indicators";
import { runStrategies } from "./strategies";
import { calculateValueRisk } from "./risk";
import {
  computeComposite,
  deriveSignal,
  deriveTimeHorizon,
  detectWarnings,
  riskPenalty,
  scoreMomentum,
  scoreSentiment,
  scoreTechnical,
  scoreValueRisk,
} from "./scoring";
import { buildExplanation } from "./explanation";
import type {
  IntelligenceSettings,
  Recommendation,
  SentimentSnapshot,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";

function toSentimentSnapshot(
  week: Awaited<ReturnType<typeof analyzeStockSentiment>>,
  month: Awaited<ReturnType<typeof analyzeStockSentiment>>,
  h24: Awaited<ReturnType<typeof analyzeStockSentiment>>
): SentimentSnapshot {
  const scale = (s: number) => Math.round(s * 100);
  return {
    score24h: scale(h24.overallScore),
    scoreWeek: scale(week.overallScore),
    scoreMonth: scale(month.overallScore),
    velocity: Math.round((week.comparison?.velocity ?? 0) * 100),
    mentionVelocity: week.comparison?.mentionVelocity ?? 0,
    mentionCount: week.mentionCount,
  };
}

export async function analyzeTicker(
  symbol: string,
  settings: IntelligenceSettings = DEFAULT_SETTINGS
): Promise<Recommendation | null> {
  const ticker = symbol.trim().toUpperCase().replace(/[^A-Z.]/g, "");
  if (!ticker) return null;

  const [market, weekSent, monthSent, h24Sent] = await Promise.all([
    fetchMarketData(ticker),
    analyzeStockSentiment(ticker, "week"),
    analyzeStockSentiment(ticker, "month"),
    analyzeStockSentiment(ticker, "24h"),
  ]);

  const tech = buildTechnicalSnapshot(market.daily, market.bars5m);
  if (!tech) return null;

  const sentiment = toSentimentSnapshot(weekSent, monthSent, h24Sent);
  const valueRisk = calculateValueRisk(tech);
  const strategies = runStrategies(tech, sentiment, ticker);
  const warnings = detectWarnings(tech, sentiment, valueRisk);

  const sentimentScore = scoreSentiment(sentiment);
  const technicalScore = scoreTechnical(tech);
  const momentumScore = scoreMomentum(tech);
  const valueRiskScore = scoreValueRisk(valueRisk);
  const penalty = riskPenalty(warnings);

  const compositeScore = computeComposite(
    sentimentScore,
    technicalScore,
    momentumScore,
    valueRiskScore,
    penalty,
    settings
  );

  const signal = deriveSignal(compositeScore, sentimentScore, technicalScore, valueRisk, strategies);
  const timeHorizon = deriveTimeHorizon(tech, strategies, settings);

  const rec: Recommendation = {
    symbol: ticker,
    analyzedAt: new Date().toISOString(),
    signal,
    confidence: compositeScore,
    sentimentScore,
    technicalScore,
    momentumScore,
    riskScore: Math.min(100, penalty + Math.max(0, 50 - valueRiskScore / 2)),
    compositeScore,
    valueRisk,
    timeHorizon,
    strategies,
    warnings,
    explanation: "",
    sentiment,
    technical: tech,
    price: tech.price,
    dailyChangePct: weekSent.price?.dailyChange ?? tech.return1d,
  };

  rec.explanation = buildExplanation(rec);
  return rec;
}

export async function analyzeUniverse(
  symbols: string[],
  settings: IntelligenceSettings = DEFAULT_SETTINGS,
  concurrency = 4
): Promise<Recommendation[]> {
  const results: Recommendation[] = [];
  for (let i = 0; i < symbols.length; i += concurrency) {
    const batch = symbols.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((s) => analyzeTicker(s, settings).catch(() => null))
    );
    for (const r of batchResults) {
      if (r) results.push(r);
    }
  }
  return results.sort((a, b) => b.compositeScore - a.compositeScore);
}
