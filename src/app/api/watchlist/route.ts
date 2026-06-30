import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
} from "@/lib/watchlist/sessionStore";
import { getRecommendationHistory } from "@/lib/intelligence/store";

export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [watchlist, history] = await Promise.all([getWatchlist(), getRecommendationHistory()]);
  return NextResponse.json({ watchlist, history });
}

export async function POST(request: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as { symbol?: string };
  if (!body.symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });
  const watchlist = await addToWatchlist(body.symbol);
  return NextResponse.json({ watchlist });
}

export async function DELETE(request: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });
  const watchlist = await removeFromWatchlist(symbol);
  return NextResponse.json({ watchlist });
}
