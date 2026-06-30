import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { analyzeUniverse } from "@/lib/intelligence/engine";
import { getSettings } from "@/lib/intelligence/store";
import { DEFAULT_UNIVERSE, type FinalSignal } from "@/lib/intelligence/types";
import { STRATEGY_CATALOG } from "@/lib/intelligence/strategies";

export const maxDuration = 120;

export async function GET(request: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const strategyId = searchParams.get("strategy");
  const minScore = Number(searchParams.get("minScore") ?? "0");
  const minVr = Number(searchParams.get("minValueRisk") ?? "0");
  const bias = searchParams.get("bias");
  const signalFilter = searchParams.get("signal")?.split(",") as FinalSignal[] | undefined;

  try {
    const settings = await getSettings();
    const all = await analyzeUniverse(DEFAULT_UNIVERSE, settings, 3);

    let filtered = all.filter((r) => r.compositeScore >= minScore);
    if (minVr > 0) filtered = filtered.filter((r) => r.valueRisk.valueToRiskRatio >= minVr);
    if (signalFilter?.length) filtered = filtered.filter((r) => signalFilter.includes(r.signal));
    if (strategyId) {
      filtered = filtered.filter((r) => r.strategies.some((s) => s.id === strategyId));
    }
    if (bias === "bullish") {
      filtered = filtered.filter((r) => r.strategies.some((s) => s.bias === "bullish"));
    } else if (bias === "bearish") {
      filtered = filtered.filter((r) => r.strategies.some((s) => s.bias === "bearish"));
    }

    return NextResponse.json({
      analyzedAt: new Date().toISOString(),
      count: filtered.length,
      strategies: STRATEGY_CATALOG,
      results: filtered,
    });
  } catch (err) {
    console.error("Strategy scan failed:", err);
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}
