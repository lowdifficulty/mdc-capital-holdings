import type { QuiverRawEvent } from "@/lib/quiver/types";
import {
  amountWeight,
  disclosureLagDays,
  isCongressEvent,
  recencyWeight,
  tradeDirection,
} from "@/lib/quiver/normalize";

export function clusterCount(events: QuiverRawEvent[], ticker: string, windowDays: number, direction: number): number {
  const cutoff = Date.now() - windowDays * 86_400_000;
  const politicians = new Set<string>();
  for (const e of events) {
    if (e.ticker !== ticker || !isCongressEvent(e)) continue;
    const d = new Date(e.filedDate ?? e.eventDate ?? 0).getTime();
    if (d < cutoff) continue;
    if (tradeDirection(e.transactionType) !== direction) continue;
    if (e.actorName) politicians.add(e.actorName);
  }
  return politicians.size;
}

export function scoreCongressEvent(event: QuiverRawEvent, allEvents: QuiverRawEvent[]): number {
  const direction = tradeDirection(event.transactionType);
  if (direction === 0) return 0;

  const amt = amountWeight(event.amountEstimate);
  const recency = recencyWeight(event.filedDate ?? event.eventDate);
  const disclosure = Math.max(0.25, 1 - disclosureLagDays(event) / 90);
  const dir = event.ticker;
  const cluster = clusterCount(allEvents, dir, 30, direction);
  const clusterMultiplier = 1 + Math.min(cluster * 0.1, 0.5);

  return 100 * direction * amt * recency * disclosure * clusterMultiplier;
}

export function scoreCongressDataset(
  events: QuiverRawEvent[],
  lookbackDays: number,
  allEvents?: QuiverRawEvent[]
): {
  score: number;
  confidence: number;
  explanation: string;
} {
  const cutoff = Date.now() - lookbackDays * 86_400_000;
  const congress = events.filter((e) => {
    if (!isCongressEvent(e)) return false;
    const t = new Date(e.filedDate ?? e.eventDate ?? 0).getTime();
    return t >= cutoff;
  });

  if (!congress.length) {
    return { score: 0, confidence: 0, explanation: "No recent Congress trades on file." };
  }

  const scores = congress.map((e) => scoreCongressEvent(e, allEvents ?? events));
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const buys = congress.filter((e) => tradeDirection(e.transactionType) > 0).length;
  const sells = congress.filter((e) => tradeDirection(e.transactionType) < 0).length;
  const ticker = events[0]?.ticker ?? congress[0]?.ticker ?? "";
  const clusterBuy = clusterCount(allEvents ?? events, ticker, 30, 1);
  const clusterSell = clusterCount(allEvents ?? events, ticker, 30, -1);

  let explanation = `${congress.length} Congress trade(s): ${buys} buy, ${sells} sell.`;
  if (clusterBuy >= 2) explanation += ` Cluster buy (${clusterBuy} politicians).`;
  if (clusterSell >= 2) explanation += ` Cluster sell (${clusterSell} politicians).`;

  const confidence = Math.min(100, 30 + congress.length * 8 + (clusterBuy + clusterSell) * 5);
  return {
    score: Math.max(-100, Math.min(100, avg)),
    confidence,
    explanation,
  };
}

export function findCongressClusters(
  events: QuiverRawEvent[],
  windowDays: number
): Array<{ ticker: string; direction: "buy" | "sell"; count: number; politicians: string[] }> {
  const cutoff = Date.now() - windowDays * 86_400_000;
  const byTicker = new Map<string, QuiverRawEvent[]>();

  for (const e of events) {
    if (!isCongressEvent(e)) continue;
    const t = new Date(e.filedDate ?? e.eventDate ?? 0).getTime();
    if (t < cutoff) continue;
    const list = byTicker.get(e.ticker) ?? [];
    list.push(e);
    byTicker.set(e.ticker, list);
  }

  const clusters: Array<{ ticker: string; direction: "buy" | "sell"; count: number; politicians: string[] }> = [];

  for (const [ticker, list] of byTicker) {
    for (const direction of ["buy", "sell"] as const) {
      const dir = direction === "buy" ? 1 : -1;
      const politicians = [
        ...new Set(
          list
            .filter((e) => tradeDirection(e.transactionType) === dir)
            .map((e) => e.actorName)
            .filter(Boolean) as string[]
        ),
      ];
      if (politicians.length >= 2) {
        clusters.push({ ticker, direction, count: politicians.length, politicians });
      }
    }
  }

  return clusters.sort((a, b) => b.count - a.count);
}
