import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { analyzeStockSentiment } from "@/lib/sentiment/analyze";

export async function GET(request: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "AAPL";

  try {
    const report = await analyzeStockSentiment(symbol);
    return NextResponse.json(report);
  } catch (err) {
    console.error("Sentiment analysis failed:", err);
    return NextResponse.json({ error: "Could not analyze sentiment" }, { status: 500 });
  }
}
