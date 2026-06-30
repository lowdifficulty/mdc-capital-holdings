import "server-only";
import { getSession } from "@/lib/auth/session";
import type { Position } from "./types";

function normalizeSymbol(symbol: string): string {
  return symbol.toUpperCase().replace(/[^A-Z.]/g, "");
}

function normalizeShares(shares: number): number {
  if (!Number.isFinite(shares) || shares < 0) return 0;
  return Math.round(shares * 10000) / 10000;
}

function normalizeAvgCost(avgCost: number): number {
  if (!Number.isFinite(avgCost) || avgCost < 0) return 0;
  return Math.round(avgCost * 100) / 100;
}

export async function getPositions(): Promise<Position[]> {
  const session = await getSession();
  return session.positions ?? [];
}

export async function addPosition(
  symbol: string,
  shares = 0,
  avgCost = 0
): Promise<Position[]> {
  const session = await getSession();
  const sym = normalizeSymbol(symbol);
  if (!sym) return session.positions ?? [];

  const list = [...(session.positions ?? [])];
  const existing = list.find((p) => p.symbol === sym);
  if (existing) return list;

  list.push({
    symbol: sym,
    shares: normalizeShares(shares),
    avgCost: normalizeAvgCost(avgCost),
    addedAt: new Date().toISOString(),
  });
  session.positions = list;
  await session.save();
  return list;
}

export async function updatePosition(
  symbol: string,
  shares: number,
  avgCost: number
): Promise<Position[]> {
  const session = await getSession();
  const sym = normalizeSymbol(symbol);
  if (!sym) return session.positions ?? [];

  const list = [...(session.positions ?? [])];
  const idx = list.findIndex((p) => p.symbol === sym);
  if (idx === -1) return list;

  list[idx] = {
    ...list[idx],
    shares: normalizeShares(shares),
    avgCost: normalizeAvgCost(avgCost),
  };
  session.positions = list;
  await session.save();
  return list;
}

export async function removePosition(symbol: string): Promise<Position[]> {
  const session = await getSession();
  const sym = normalizeSymbol(symbol);
  const list = (session.positions ?? []).filter((p) => p.symbol !== sym);
  session.positions = list;
  await session.save();
  return list;
}
