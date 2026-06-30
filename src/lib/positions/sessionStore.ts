import "server-only";
import { getSession } from "@/lib/auth/session";
import { readPositionsFile, writePositionsFile } from "./fileStore";
import { PORTFOLIO_SEED_VERSION, toPositions } from "./portfolioSeed";
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

async function seedSessionPositions(): Promise<Position[]> {
  const session = await getSession();
  const seeded = toPositions();
  session.positions = seeded;
  session.portfolioSeedVersion = PORTFOLIO_SEED_VERSION;
  await session.save();
  try {
    await writePositionsFile(seeded);
  } catch {
    /* file store optional on serverless */
  }
  return seeded;
}

async function loadPositions(): Promise<Position[]> {
  const session = await getSession();
  if (session.portfolioSeedVersion !== PORTFOLIO_SEED_VERSION) {
    return seedSessionPositions();
  }
  if (session.positions?.length) return session.positions;

  const filePositions = await readPositionsFile();
  if (filePositions.length > 0) {
    session.positions = filePositions;
    await session.save();
    return filePositions;
  }

  return seedSessionPositions();
}

async function persistPositions(positions: Position[]): Promise<Position[]> {
  const session = await getSession();
  session.positions = positions;
  await session.save();
  try {
    await writePositionsFile(positions);
  } catch {
    /* file store optional on serverless */
  }
  return positions;
}

export async function getPositions(): Promise<Position[]> {
  return loadPositions();
}

export async function addPosition(
  symbol: string,
  shares = 0,
  avgCost = 0
): Promise<Position[]> {
  const sym = normalizeSymbol(symbol);
  if (!sym) return loadPositions();

  const list = [...(await loadPositions())];
  const existing = list.find((p) => p.symbol === sym);

  if (existing) {
    if (shares > 0 || avgCost > 0) {
      existing.shares = normalizeShares(shares > 0 ? shares : existing.shares);
      existing.avgCost = normalizeAvgCost(avgCost > 0 ? avgCost : existing.avgCost);
    }
    return persistPositions(list);
  }

  list.push({
    symbol: sym,
    shares: normalizeShares(shares),
    avgCost: normalizeAvgCost(avgCost),
    addedAt: new Date().toISOString(),
  });
  return persistPositions(list);
}

export async function updatePosition(
  symbol: string,
  shares: number,
  avgCost: number
): Promise<Position[]> {
  const sym = normalizeSymbol(symbol);
  if (!sym) return loadPositions();

  const list = [...(await loadPositions())];
  const idx = list.findIndex((p) => p.symbol === sym);
  if (idx === -1) return list;

  list[idx] = {
    ...list[idx],
    shares: normalizeShares(shares),
    avgCost: normalizeAvgCost(avgCost),
  };
  return persistPositions(list);
}

export async function removePosition(symbol: string): Promise<Position[]> {
  const sym = normalizeSymbol(symbol);
  const list = (await loadPositions()).filter((p) => p.symbol !== sym);
  return persistPositions(list);
}

export async function importPositions(
  incoming: Array<{ symbol: string; shares: number; avgCost: number }>,
  replace = false
): Promise<Position[]> {
  const normalized = incoming
    .map((p) => ({
      symbol: normalizeSymbol(p.symbol),
      shares: normalizeShares(p.shares),
      avgCost: normalizeAvgCost(p.avgCost),
    }))
    .filter((p) => p.symbol && p.shares > 0);

  if (replace) {
    const fresh = normalized.map((p) => ({
      ...p,
      addedAt: new Date().toISOString(),
    }));
    return persistPositions(fresh);
  }

  const list = [...(await loadPositions())];
  const bySymbol = new Map(list.map((p) => [p.symbol, p]));

  for (const p of normalized) {
    const existing = bySymbol.get(p.symbol);
    if (existing) {
      existing.shares = p.shares;
      existing.avgCost = p.avgCost;
    } else {
      list.push({ ...p, addedAt: new Date().toISOString() });
    }
  }

  return persistPositions(list);
}

/** Sync session with deployed portfolio seed (e.g. after screenshot update). */
export async function syncPortfolioSeed(): Promise<Position[]> {
  return seedSessionPositions();
}
