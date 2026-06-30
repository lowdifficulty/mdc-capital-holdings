import "server-only";
import { DATASET_ENDPOINTS, extractRows, fetchQuiverDataset, getQuiverApiKey } from "@/lib/quiver/client";
import { defaultLookbackDays } from "@/lib/quiver/config";
import { normalizeRows } from "@/lib/quiver/normalize";
import {
  finishRun,
  getAllDailyScores,
  getAllEvents,
  getUniqueTickers,
  saveDailyScores,
  startRun,
  upsertEvents,
} from "@/lib/quiver/store";
import type { TickerDailyScore } from "@/lib/quiver/types";
import { PORTFOLIO_POSITIONS } from "@/lib/positions/portfolioSeed";
import {
  buildExplanation,
  computeRiskScore,
  datasetsToScores,
  recommend,
  scoreTicker,
} from "./scoring";

const WATCHLIST = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL", "GME", "PLTR"];

export function defaultTickerUniverse(): string[] {
  const fromPortfolio = PORTFOLIO_POSITIONS.map((p) => p.symbol);
  return [...new Set([...fromPortfolio, ...WATCHLIST])].sort();
}

export async function ingestAllDatasets(): Promise<{
  runId: string;
  eventsAdded: number;
  errors: string[];
}> {
  const run = await startRun("Full Quiver ingestion");
  const { eventsAdded, errors, processed } = await ingestDatasets(run.id);
  await finishRun(run.id, {
    status: errors.length && !processed.length ? "failed" : "completed",
    datasetsProcessed: processed,
    tickersProcessed: await getUniqueTickers(),
    errors,
  });
  return { runId: run.id, eventsAdded, errors };
}

async function ingestDatasets(runId: string): Promise<{
  eventsAdded: number;
  errors: string[];
  processed: string[];
}> {
  if (!getQuiverApiKey()) {
    throw new Error("QUIVER_API_KEY not configured");
  }

  let eventsAdded = 0;
  const errors: string[] = [];
  const processed: string[] = [];

  for (const endpoint of DATASET_ENDPOINTS) {
    try {
      const data = await fetchQuiverDataset(endpoint);
      if (!data) {
        errors.push(`${endpoint.dataset}: unavailable on current tier`);
        continue;
      }
      const rows = extractRows(data);
      const normalized = normalizeRows(endpoint.dataset, rows.length ? rows : data);
      const added = await upsertEvents(normalized);
      eventsAdded += added;
      processed.push(endpoint.dataset);
      await finishRun(runId, { datasetsProcessed: [...processed], errors });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${endpoint.dataset}: ${msg}`);
      console.error(`[quiver ingest] ${endpoint.dataset}:`, msg);
    }
  }

  return { eventsAdded, errors, processed };
}

export async function scoreAllTickers(
  tickers?: string[],
  lookbackDays = defaultLookbackDays()
): Promise<TickerDailyScore[]> {
  const events = await getAllEvents(20_000);
  const universe =
    tickers ??
    [...new Set([...defaultTickerUniverse(), ...(await getUniqueTickers())])].slice(0, 120);

  const now = new Date().toISOString();
  const scores: TickerDailyScore[] = [];

  for (const ticker of universe) {
    const { datasets, totalSentiment, confidence } = scoreTicker(ticker, events, lookbackDays);
    const risk = computeRiskScore(events, ticker, datasets, totalSentiment);
    const recommendation = recommend(totalSentiment, risk);
    const explanation = buildExplanation(ticker, totalSentiment, risk, recommendation, datasets);
    const ds = datasetsToScores(datasets);

    scores.push({
      id: `${ticker}-${now.slice(0, 10)}`,
      ticker: ticker.toUpperCase(),
      scoreDate: now,
      ...ds,
      total_sentiment_score: Math.round(totalSentiment * 10) / 10,
      risk_score: Math.round(risk),
      value_to_risk_score: Math.round((totalSentiment / Math.max(risk, 10)) * 10) / 10,
      recommendation,
      confidence_score: Math.round(confidence),
      explanation,
      createdAt: now,
      updatedAt: now,
    });
  }

  await saveDailyScores(scores);
  return scores;
}

export async function runFullAnalysis(): Promise<{
  ingestion: { runId: string; eventsAdded: number; errors: string[] };
  scores: TickerDailyScore[];
}> {
  const run = await startRun("Full Quiver analysis");
  try {
    const { eventsAdded, errors, processed } = await ingestDatasets(run.id);
    const scores = await scoreAllTickers();
    await finishRun(run.id, {
      status: errors.length && !processed.length ? "failed" : "completed",
      datasetsProcessed: processed,
      tickersProcessed: scores.map((s) => s.ticker),
      errors,
    });
    return { ingestion: { runId: run.id, eventsAdded, errors }, scores };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await finishRun(run.id, { status: "failed", errors: [msg] });
    throw err;
  }
}

export async function getRankedTickers(
  sort: "sentiment" | "risk" | "value_to_risk" | "congress" | "insider" = "sentiment",
  limit = 50
): Promise<TickerDailyScore[]> {
  let scores = await getAllDailyScores();
  if (!scores.length) {
    scores = await scoreAllTickers();
  }

  const keyMap = {
    sentiment: "total_sentiment_score",
    risk: "risk_score",
    value_to_risk: "value_to_risk_score",
    congress: "congress_score",
    insider: "insider_score",
  } as const;

  const field = keyMap[sort];
  return [...scores].sort((a, b) => (b[field] as number) - (a[field] as number)).slice(0, limit);
}
