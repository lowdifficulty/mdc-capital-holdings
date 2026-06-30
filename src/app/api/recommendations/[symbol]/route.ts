import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { analyzeTicker } from "@/lib/intelligence/engine";
import { getSettings, recordRecommendation } from "@/lib/intelligence/store";

export const maxDuration = 120;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { symbol } = await params;
  try {
    const settings = await getSettings();
    const rec = await analyzeTicker(symbol, settings);
    if (!rec) return NextResponse.json({ error: "Could not analyze ticker" }, { status: 404 });
    await recordRecommendation(rec);
    return NextResponse.json(rec);
  } catch (err) {
    console.error("Ticker recommendation failed:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
