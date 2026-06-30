import "server-only";
import { fetchBulkPriceSnapshots } from "@/lib/sentiment/prices";
import type { Position, PositionWithQuote, PositionsReport, PositionsSummary } from "./types";

function buildSummary(positions: PositionWithQuote[]): PositionsSummary {
  let totalMarketValue = 0;
  let totalCostBasis = 0;

  for (const p of positions) {
    if (p.marketValue != null) totalMarketValue += p.marketValue;
    if (p.costBasis != null) totalCostBasis += p.costBasis;
  }

  const totalUnrealizedPnL = totalMarketValue - totalCostBasis;
  const totalUnrealizedPnLPct =
    totalCostBasis > 0 ? (totalUnrealizedPnL / totalCostBasis) * 100 : 0;

  return {
    totalMarketValue,
    totalCostBasis,
    totalUnrealizedPnL,
    totalUnrealizedPnLPct,
  };
}

export async function enrichPositions(positions: Position[]): Promise<PositionsReport> {
  const symbols = positions.map((p) => p.symbol);
  const priceMap = await fetchBulkPriceSnapshots(symbols);

  const enriched: PositionWithQuote[] = positions.map((p) => {
    const quote = priceMap.get(p.symbol);
    const price = quote?.price;
    const costBasis = p.shares > 0 && p.avgCost > 0 ? p.shares * p.avgCost : undefined;
    const marketValue = price != null && p.shares > 0 ? p.shares * price : undefined;
    const unrealizedPnL =
      marketValue != null && costBasis != null ? marketValue - costBasis : undefined;
    const unrealizedPnLPct =
      unrealizedPnL != null && costBasis != null && costBasis > 0
        ? (unrealizedPnL / costBasis) * 100
        : undefined;

    return {
      ...p,
      price,
      dailyChange: quote?.dailyChange,
      marketValue,
      costBasis,
      unrealizedPnL,
      unrealizedPnLPct,
    };
  });

  return {
    positions: enriched,
    summary: buildSummary(enriched),
    updatedAt: new Date().toISOString(),
  };
}
