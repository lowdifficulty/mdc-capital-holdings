import type { QuiverRawEvent } from "@/lib/quiver/types";
import { isCongressEvent, tradeDirection } from "@/lib/quiver/normalize";
import type { DatasetScores, RecommendationLabel, TickerDailyScore } from "@/lib/quiver/types";
import { DATASET_WEIGHTS, RECOMMENDATION_THRESHOLDS } from "@/lib/quiver/config";
import { scoreCongressDataset } from "./congressScoring";
import {
  scoreDonorDataset,
  scoreGovContractDataset,
  scoreHedgeFundDataset,
  scoreInsiderDataset,
  scoreLobbyingDataset,
  scoreNewsDataset,
  scoreOffExchangeDataset,
  scorePatentDataset,
  scoreSocialDataset,
} from "./insiderScoring";

export interface DatasetResult {
  key: keyof DatasetScores;
  dataset: string;
  score: number;
  confidence: number;
  weight: number;
  explanation: string;
}

export function scoreTicker(
  ticker: string,
  events: QuiverRawEvent[],
  lookbackDays: number,
  allEvents?: QuiverRawEvent[]
): { datasets: DatasetResult[]; totalSentiment: number; confidence: number } {
  const tickerEvents = events.filter((e) => e.ticker === ticker.toUpperCase());
  const clusterPool = allEvents ?? events;

  const congress = scoreCongressDataset(tickerEvents, lookbackDays, clusterPool);
  const insider = scoreInsiderDataset(tickerEvents, lookbackDays);
  const hedge = scoreHedgeFundDataset(tickerEvents, lookbackDays);
  const gov = scoreGovContractDataset(tickerEvents, lookbackDays);
  const lobbying = scoreLobbyingDataset(tickerEvents, lookbackDays);
  const donor = scoreDonorDataset(tickerEvents, lookbackDays);
  const patent = scorePatentDataset(tickerEvents, lookbackDays);
  const offEx = scoreOffExchangeDataset(tickerEvents, lookbackDays);
  const news = scoreNewsDataset(tickerEvents, lookbackDays);
  const social = scoreSocialDataset(tickerEvents, lookbackDays);

  const datasets: DatasetResult[] = [
    { key: "congress_score", dataset: "congress_trades", ...congress, weight: DATASET_WEIGHTS.congress_trades },
    { key: "insider_score", dataset: "insider_trades", ...insider, weight: DATASET_WEIGHTS.insider_trades },
    { key: "hedge_fund_score", dataset: "hedge_fund_activity", ...hedge, weight: DATASET_WEIGHTS.hedge_fund_activity },
    { key: "gov_contract_score", dataset: "government_contracts", ...gov, weight: DATASET_WEIGHTS.government_contracts },
    { key: "lobbying_score", dataset: "corporate_lobbying", ...lobbying, weight: DATASET_WEIGHTS.corporate_lobbying },
    { key: "donor_score", dataset: "corporate_donors", ...donor, weight: DATASET_WEIGHTS.corporate_donors },
    { key: "patent_score", dataset: "patents", ...patent, weight: DATASET_WEIGHTS.patents },
    { key: "off_exchange_score", dataset: "off_exchange_short_volume", ...offEx, weight: DATASET_WEIGHTS.off_exchange_short_volume },
    { key: "news_score", dataset: "newsfeed", ...news, weight: DATASET_WEIGHTS.newsfeed },
    { key: "social_score", dataset: "social", ...social, weight: DATASET_WEIGHTS.social },
    {
      key: "executive_compensation_score",
      dataset: "executive_compensation",
      score: 0,
      confidence: 0,
      weight: DATASET_WEIGHTS.executive_compensation,
      explanation: "Executive compensation dataset not yet ingested for this ticker.",
    },
    {
      key: "top_shareholder_score",
      dataset: "top_shareholders",
      score: 0,
      confidence: 0,
      weight: DATASET_WEIGHTS.top_shareholders,
      explanation: "Top shareholder dataset not yet ingested for this ticker.",
    },
  ];

  let weightedSum = 0;
  let weightDenom = 0;
  let confSum = 0;
  let confN = 0;

  for (const d of datasets) {
    if (d.confidence <= 0) continue;
    const effectiveWeight = d.weight * (d.confidence / 100);
    weightedSum += d.score * effectiveWeight;
    weightDenom += effectiveWeight;
    confSum += d.confidence;
    confN++;
  }

  const totalSentiment = weightDenom > 0 ? weightedSum / weightDenom : 0;
  const confidence = confN > 0 ? Math.min(100, confSum / confN) : 10;

  return { datasets, totalSentiment, confidence };
}

export function computeRiskScore(
  events: QuiverRawEvent[],
  ticker: string,
  datasetResults: DatasetResult[],
  totalSentiment: number
): number {
  let risk = 15;
  const tickerEvents = events.filter((e) => e.ticker === ticker.toUpperCase());

  const offEx = datasetResults.find((d) => d.dataset === "off_exchange_short_volume");
  if (offEx && offEx.score < -20) risk += 18;

  const insiderSells = tickerEvents.filter(
    (e) => e.sourceDataset === "insider_trades" && tradeDirection(e.transactionType) < 0
  ).length;
  const insiderBuys = tickerEvents.filter(
    (e) => e.sourceDataset === "insider_trades" && tradeDirection(e.transactionType) > 0
  ).length;
  if (insiderSells > insiderBuys + 1) risk += 12;

  const congressSells = tickerEvents.filter(
    (e) => isCongressEvent(e) && tradeDirection(e.transactionType) < 0
  ).length;
  const congressBuys = tickerEvents.filter(
    (e) => isCongressEvent(e) && tradeDirection(e.transactionType) > 0
  ).length;
  if (congressSells > congressBuys + 1) risk += 15;

  const news = datasetResults.find((d) => d.dataset === "newsfeed");
  if (news && news.score < -25) risk += 10;

  const activeSources = datasetResults.filter((d) => d.confidence > 0).length;
  if (activeSources <= 2) risk += 12;

  const bullish = datasetResults.filter((d) => d.score > 20 && d.confidence > 0).length;
  const bearish = datasetResults.filter((d) => d.score < -20 && d.confidence > 0).length;
  if (bullish > 0 && bearish > 0) risk += 10;

  if (totalSentiment > 50 && risk > 40) risk += 5;

  return Math.max(0, Math.min(100, risk));
}

export function recommend(
  sentiment: number,
  risk: number
): RecommendationLabel {
  const t = RECOMMENDATION_THRESHOLDS;
  if (sentiment <= t.strongBearish) return "Strong Bearish";
  if (sentiment <= t.bearish) return "Bearish";
  if (sentiment >= t.strongBullish.sentiment && risk <= t.strongBullish.maxRisk) return "Strong Bullish";
  if (sentiment >= t.cautionMinSentiment && risk >= t.cautionMinRisk && sentiment < t.bullish) {
    return "Caution";
  }
  if (sentiment >= t.bullish) return "Bullish";
  if (sentiment >= t.slightlyBullish) return "Slightly Bullish";
  return "Neutral";
}

export function buildExplanation(
  ticker: string,
  sentiment: number,
  risk: number,
  recommendation: RecommendationLabel,
  datasets: DatasetResult[]
): TickerDailyScore["explanation"] {
  const active = datasets.filter((d) => d.confidence > 0);
  const drivers = [...active]
    .sort((a, b) => Math.abs(b.score) * b.confidence - Math.abs(a.score) * a.confidence)
    .filter((d) => Math.abs(d.score) >= 15)
    .slice(0, 4)
    .map((d) => d.explanation);

  const risks = active
    .filter((d) => d.score < -15 || d.dataset === "off_exchange_short_volume")
    .slice(0, 3)
    .map((d) => d.explanation);

  const summary = `${ticker} is ${recommendation} with sentiment ${sentiment.toFixed(0)} and risk ${risk.toFixed(0)}. ${
    drivers.length
      ? `Key drivers: ${drivers.slice(0, 2).join(" ")}`
      : "Limited alternative-data coverage reduces confidence."
  }`;

  return {
    summary,
    drivers,
    risks,
    datasetBreakdown: active.map((d) => ({
      dataset: d.dataset,
      score: Math.round(d.score),
      confidence: Math.round(d.confidence),
      weight: d.weight,
    })),
  };
}

export function datasetsToScores(datasets: DatasetResult[]): DatasetScores {
  const out: DatasetScores = {
    congress_score: 0,
    insider_score: 0,
    hedge_fund_score: 0,
    gov_contract_score: 0,
    lobbying_score: 0,
    donor_score: 0,
    patent_score: 0,
    off_exchange_score: 0,
    news_score: 0,
    social_score: 0,
    executive_compensation_score: 0,
    top_shareholder_score: 0,
  };
  for (const d of datasets) {
    out[d.key] = Math.round(d.score * 10) / 10;
  }
  return out;
}
