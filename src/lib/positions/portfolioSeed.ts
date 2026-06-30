import type { Position } from "./types";

/** Bump when screenshot holdings change — forces session re-sync on next load. */
export const PORTFOLIO_SEED_VERSION = 4;

interface Lot {
  symbol: string;
  shares: number;
  avgCost: number;
}

/** Fidelity Individual Z36819792 — avg from "Average cost basis" (3rd column from right). */
const FIDELITY_LOTS: Lot[] = [
  { symbol: "BBC", shares: 4, avgCost: 53.06 },
  { symbol: "DRTS", shares: 20, avgCost: 12.26 },
  { symbol: "FOR", shares: 5, avgCost: 31.73 },
  { symbol: "INTC", shares: 4, avgCost: 142.23 },
  { symbol: "NBIS", shares: 1, avgCost: 282.42 },
  { symbol: "OUST", shares: 3, avgCost: 62.51 },
  { symbol: "RBLX", shares: 3, avgCost: 55.35 },
  { symbol: "SPY", shares: 1, avgCost: 746.92 },
  { symbol: "TSHA", shares: 20, avgCost: 6.91 },
  { symbol: "VRT", shares: 1, avgCost: 323.32 },
];

/** Trading platform — avg from "Avg Price" (6th column from left). */
const TRADING_LOTS: Lot[] = [
  { symbol: "AM", shares: 4, avgCost: 22.93 },
  { symbol: "GRPN", shares: 5, avgCost: 24.64 },
  { symbol: "FCEL", shares: 5, avgCost: 35.65 },
  { symbol: "OUST", shares: 4, avgCost: 57.2 },
  { symbol: "BBC", shares: 2, avgCost: 52.63 },
  { symbol: "RIVN", shares: 10, avgCost: 16.8 },
  { symbol: "RBLX", shares: 2, avgCost: 54.0 },
];

/** Cash from brokerage screenshots (Fidelity pending activity + trading net − positions). */
export const PORTFOLIO_CASH = {
  fidelity: 47_957.46,
  trading: 49_002.67,
} as const;

export function totalCashBalance(): number {
  return PORTFOLIO_CASH.fidelity + PORTFOLIO_CASH.trading;
}

function mergeLots(lots: Lot[]): Array<{ symbol: string; shares: number; avgCost: number }> {
  const bySymbol = new Map<string, { shares: number; totalCost: number }>();

  for (const lot of lots) {
    const sym = lot.symbol.toUpperCase();
    const bucket = bySymbol.get(sym) ?? { shares: 0, totalCost: 0 };
    bucket.shares += lot.shares;
    bucket.totalCost += lot.shares * lot.avgCost;
    bySymbol.set(sym, bucket);
  }

  return Array.from(bySymbol.entries())
    .map(([symbol, { shares, totalCost }]) => ({
      symbol,
      shares,
      avgCost: Math.round((totalCost / shares) * 100) / 100,
    }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
}

export const PORTFOLIO_POSITIONS = mergeLots([...FIDELITY_LOTS, ...TRADING_LOTS]);

export function toPositions(seed = PORTFOLIO_POSITIONS): Position[] {
  const now = new Date().toISOString();
  return seed.map((p) => ({
    symbol: p.symbol.toUpperCase(),
    shares: p.shares,
    avgCost: p.avgCost,
    addedAt: now,
  }));
}
