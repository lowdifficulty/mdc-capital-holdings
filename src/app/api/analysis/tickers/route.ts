import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getRankedTickers } from "@/lib/analysis/engine";
import { getAllDailyScores } from "@/lib/quiver/store";

export const maxDuration = 120;

export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scores = await getAllDailyScores();
  if (!scores.length) {
    const ranked = await getRankedTickers("sentiment", 100);
    return NextResponse.json({ tickers: ranked, analyzedAt: new Date().toISOString() });
  }

  return NextResponse.json({
    tickers: scores.sort((a, b) => b.total_sentiment_score - a.total_sentiment_score),
    analyzedAt: scores[0]?.updatedAt ?? new Date().toISOString(),
  });
}
