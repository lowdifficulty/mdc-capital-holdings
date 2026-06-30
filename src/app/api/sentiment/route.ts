import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { analyzeMovers, analyzeStockSentiment } from "@/lib/sentiment/analyze";
import { fetchChartSeries } from "@/lib/sentiment/chartDataServer";
import type { ChartRangeId } from "@/lib/sentiment/chartData";
import { fetchPriceHistory } from "@/lib/sentiment/prices";
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

  if (view === "chart") {
    const symbol = searchParams.get("symbol");
    if (!symbol) {
      return NextResponse.json({ error: "symbol required" }, { status: 400 });
    }
    const range = searchParams.get("range") ?? "5d";
    const validRanges = ["1d", "5d", "1mo", "1y", "5y"];
    if (!validRanges.includes(range)) {
      return NextResponse.json({ error: "invalid range" }, { status: 400 });
    }
    try {
      const series = await fetchChartSeries(symbol, range as ChartRangeId);
      if (!series) {
        return NextResponse.json({ error: "Chart data unavailable" }, { status: 404 });
      }
      return NextResponse.json(series);
    } catch (err) {
      console.error("Chart fetch failed:", err);
      return NextResponse.json({ error: "Could not fetch chart" }, { status: 500 });
    }
  }

  if (view === "price") {
    const symbol = searchParams.get("symbol");
    if (!symbol) {
      return NextResponse.json({ error: "symbol required" }, { status: 400 });
    }
    try {
      const history = await fetchPriceHistory(symbol);
      if (!history) {
        return NextResponse.json({ error: "Price data unavailable" }, { status: 404 });
      }
      return NextResponse.json({ symbol: symbol.toUpperCase(), ...history });
    } catch (err) {
      console.error("Price history failed:", err);
      return NextResponse.json({ error: "Could not fetch price history" }, { status: 500 });
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
