import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { analyzeTicker } from "@/lib/intelligence/engine";
import { getSettings } from "@/lib/intelligence/store";

export const maxDuration = 120;

export async function GET(request: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const symbol = new URL(request.url).searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  const settings = await getSettings();
  const rec = await analyzeTicker(symbol, settings);
  if (!rec) return NextResponse.json({ error: "Risk assessment failed" }, { status: 404 });

  return NextResponse.json({
    symbol: rec.symbol,
    valueRisk: rec.valueRisk,
    riskScore: rec.riskScore,
    warnings: rec.warnings,
    timeHorizon: rec.timeHorizon,
  });
}
