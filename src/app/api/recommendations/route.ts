import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { analyzeTicker, analyzeUniverse } from "@/lib/intelligence/engine";
import { getSettings, recordRecommendation } from "@/lib/intelligence/store";
import { DEFAULT_UNIVERSE } from "@/lib/intelligence/types";

export const maxDuration = 120;

export async function GET(request: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  try {
    const settings = await getSettings();

    if (symbol) {
      const rec = await analyzeTicker(symbol, settings);
      if (!rec) return NextResponse.json({ error: "Could not analyze ticker" }, { status: 404 });
      await recordRecommendation(rec);
      return NextResponse.json(rec);
    }

    const universe = DEFAULT_UNIVERSE;
    const recommendations = await analyzeUniverse(universe, settings, 3);
    for (const rec of recommendations) await recordRecommendation(rec);

    const positiveSentiment = [...recommendations]
      .sort((a, b) => b.sentiment.velocity - a.sentiment.velocity)
      .slice(0, 5);
    const negativeSentiment = [...recommendations]
      .sort((a, b) => a.sentiment.velocity - b.sentiment.velocity)
      .slice(0, 5);
    const bestValueRisk = [...recommendations]
      .filter((r) => r.valueRisk.valueToRiskRatio >= settings.minValueRisk)
      .sort((a, b) => b.valueRisk.valueToRiskRatio - a.valueRisk.valueToRiskRatio)
      .slice(0, 5);

    return NextResponse.json({
      analyzedAt: new Date().toISOString(),
      topRecommendations: recommendations.filter((r) => r.signal === "Strong Buy" || r.signal === "Buy").slice(0, 10),
      all: recommendations,
      positiveSentiment,
      negativeSentiment,
      bestValueRisk,
      disclaimer: "Algorithmic research only — not financial advice. No automatic trade execution.",
    });
  } catch (err) {
    console.error("Recommendations failed:", err);
    return NextResponse.json({ error: "Could not generate recommendations" }, { status: 500 });
  }
}
