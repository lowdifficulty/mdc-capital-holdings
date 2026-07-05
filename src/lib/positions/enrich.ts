import "server-only";
import { fetchLiveBulkPriceSnapshots } from "@/lib/sentiment/prices";
import { PORTFOLIO_CASH, PORTFOLIO_REALIZED_TRADES, totalCashBalance } from "./portfolioSeed";
import type { Position, PositionWithQuote, PositionsReport, PositionsSummary } from "./types";

function priorClose(price: number, dailyChangePct: number): number {
  return price / (1 + dailyChangePct / 100);
}

function buildSummary(positions: PositionWithQuote[]): PositionsSummary {
  let totalMarketValue = 0;
  let totalCostBasis = 0;
  let totalDailyPnL = 0;
  let priorValue = 0;

  for (const p of positions) {
    if (p.marketValue != null) totalMarketValue += p.marketValue;
    if (p.costBasis != null) totalCostBasis += p.costBasis;
    if (p.dailyPnL != null) totalDailyPnL += p.dailyPnL;
    if (p.price != null && p.dailyChange != null && p.shares > 0) {
      priorValue += p.shares * priorClose(p.price, p.dailyChange);
    }
  }

  const totalUnrealizedPnL = totalMarketValue - totalCostBasis;
  const totalUnrealizedPnLPct =
    totalCostBasis > 0 ? (totalUnrealizedPnL / totalCostBasis) * 100 : 0;
  const totalDailyPnLPct =
    priorValue > 0 ? (totalDailyPnL / priorValue) * 100 : 0;

  const cashBalance = totalCashBalance();

  return {
    totalMarketValue,
    totalCostBasis,
    totalUnrealizedPnL,
    totalUnrealizedPnLPct,
    totalDailyPnL,
    totalDailyPnLPct,
    cashBalance,
    cashFidelity: PORTFOLIO_CASH.fidelity,
    cashTrading: PORTFOLIO_CASH.trading,
    totalPortfolioValue: totalMarketValue + cashBalance,
  };
}

export async function enrichPositions(positions: Position[]): Promise<PositionsReport> {
  const symbols = positions.map((p) => p.symbol);
  const priceMap = await fetchLiveBulkPriceSnapshots(symbols);

  const enriched: PositionWithQuote[] = positions.map((p) => {
    const quote = priceMap.get(p.symbol);
    const price = quote?.price;
    const dailyChange = quote?.dailyChange;
    const costBasis = p.shares > 0 && p.avgCost > 0 ? p.shares * p.avgCost : undefined;
    const marketValue = price != null && p.shares > 0 ? p.shares * price : undefined;
    const unrealizedPnL =
      marketValue != null && costBasis != null ? marketValue - costBasis : undefined;
    const unrealizedPnLPct =
      unrealizedPnL != null && costBasis != null && costBasis > 0
        ? (unrealizedPnL / costBasis) * 100
        : undefined;

    const prev = price != null && dailyChange != null ? priorClose(price, dailyChange) : undefined;
    const dailyPnL =
      price != null && prev != null && p.shares > 0 ? p.shares * (price - prev) : undefined;
    const dailyPnLPct =
      dailyPnL != null && prev != null && p.shares > 0
        ? (dailyPnL / (p.shares * prev)) * 100
        : undefined;

    return {
      ...p,
      price,
      dailyChange,
      marketValue,
      costBasis,
      unrealizedPnL,
      unrealizedPnLPct,
      dailyPnL,
      dailyPnLPct,
    };
  });

  return {
    positions: enriched.sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0)),
    realizedTrades: PORTFOLIO_REALIZED_TRADES,
    summary: buildSummary(enriched),
    updatedAt: new Date().toISOString(),
  };
}
