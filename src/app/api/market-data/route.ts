import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { fetchMarketData } from "@/lib/intelligence/market-data";
import { buildTechnicalSnapshot } from "@/lib/intelligence/indicators";

export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const symbol = new URL(request.url).searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  try {
    const data = await fetchMarketData(symbol);
    const technical = buildTechnicalSnapshot(data.daily, data.bars5m);
    return NextResponse.json({ symbol: symbol.toUpperCase(), ...data, technical });
  } catch (err) {
    console.error("Market data failed:", err);
    return NextResponse.json({ error: "Market data unavailable" }, { status: 500 });
  }
}
