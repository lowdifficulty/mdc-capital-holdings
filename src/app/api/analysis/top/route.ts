import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getRankedTickers } from "@/lib/analysis/engine";

export const maxDuration = 120;

export async function GET(request: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const window = searchParams.get("window") ?? "30d";
  const sort = (searchParams.get("sort") ?? "sentiment") as
    | "sentiment"
    | "risk"
    | "value_to_risk"
    | "congress"
    | "insider";
  const limit = Math.min(Number(searchParams.get("limit") ?? 25), 100);

  const lookbackMap: Record<string, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "1y": 365,
  };
  const lookback = lookbackMap[window] ?? 30;

  const tickers = await getRankedTickers(sort, limit);

  return NextResponse.json({
    window,
    lookbackDays: lookback,
    sort,
    tickers,
    analyzedAt: new Date().toISOString(),
  });
}
