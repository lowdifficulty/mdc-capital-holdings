import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { analyzeMovers, analyzeStockSentiment } from "@/lib/sentiment/analyze";
import type { SentimentPeriod } from "@/lib/sentiment/types";

export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view");

  if (view === "movers") {
    try {
      const report = await analyzeMovers();
      return NextResponse.json(report);
    } catch (err) {
      console.error("Movers analysis failed:", err);
      return NextResponse.json({ error: "Could not analyze movers" }, { status: 500 });
    }
  }

  const symbol = searchParams.get("symbol") ?? "AAPL";
  const period = (searchParams.get("period") ?? "week") as SentimentPeriod;

  if (period !== "24h" && period !== "week" && period !== "month") {
    return NextResponse.json({ error: "period must be 24h, week, or month" }, { status: 400 });
  }

  try {
    const report = await analyzeStockSentiment(symbol, period);
    return NextResponse.json(report);
  } catch (err) {
    console.error("Sentiment analysis failed:", err);
    return NextResponse.json({ error: "Could not analyze sentiment" }, { status: 500 });
  }
}
