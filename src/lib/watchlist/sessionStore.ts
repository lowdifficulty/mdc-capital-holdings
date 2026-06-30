import "server-only";
import { getSession } from "@/lib/auth/session";

export async function getWatchlist(): Promise<string[]> {
  const session = await getSession();
  return session.watchlist ?? [];
}

export async function addToWatchlist(symbol: string): Promise<string[]> {
  const session = await getSession();
  const sym = symbol.toUpperCase().replace(/[^A-Z.]/g, "");
  if (!sym) return session.watchlist ?? [];

  const list = [...(session.watchlist ?? [])];
  if (!list.includes(sym)) list.push(sym);
  session.watchlist = list;
  await session.save();
  return list;
}

export async function removeFromWatchlist(symbol: string): Promise<string[]> {
  const session = await getSession();
  const sym = symbol.toUpperCase();
  const list = (session.watchlist ?? []).filter((s) => s !== sym);
  session.watchlist = list;
  await session.save();
  return list;
}
