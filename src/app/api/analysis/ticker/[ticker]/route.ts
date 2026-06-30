import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { scoreTicker } from "@/lib/analysis/scoring";
import { defaultLookbackDays } from "@/lib/quiver/config";
import {
  getDailyScore,
  getEventsForTicker,
  getSignalScoresForTicker,
} from "@/lib/quiver/store";
import { scoreAllTickers } from "@/lib/analysis/engine";

export const maxDuration = 120;

export async function GET(
  _request: Request,
  context: { params: Promise<{ ticker: string }> }
) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ticker } = await context.params;
  const sym = ticker.toUpperCase();

  let analysis = await getDailyScore(sym);
  if (!analysis) {
    await scoreAllTickers([sym]);
    analysis = await getDailyScore(sym);
  }

  const events = await getEventsForTicker(sym, 80);
  const signals = await getSignalScoresForTicker(sym);

  if (!analysis) {
    const { datasets, totalSentiment, confidence } = scoreTicker(sym, events, defaultLookbackDays());
    return NextResponse.json({
      ticker: sym,
      analysis: null,
      livePreview: { datasets, totalSentiment, confidence },
      recentEvents: events.slice(0, 40),
      signals,
    });
  }

  return NextResponse.json({
    ticker: sym,
    analysis,
    recentEvents: events.slice(0, 40),
    signals,
  });
}
