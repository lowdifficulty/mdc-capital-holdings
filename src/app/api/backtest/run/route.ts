import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { backtestCongressSignals } from "@/lib/backtest/backtester";
import { summarizeBacktest } from "@/lib/backtest/metrics";
import { getAllEvents } from "@/lib/quiver/store";
import { readPriceCache } from "@/lib/sentiment/priceCache";

export const maxDuration = 120;

export async function POST() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const events = await getAllEvents(50_000);
    const cache = await readPriceCache();
    const priceBarsByTicker: Record<string, { date: string; close: number }[]> = {};

    for (const [sym, entry] of Object.entries(cache.symbols)) {
      priceBarsByTicker[sym] = (entry.dailyBars ?? [])
        .map((b) => ({
          date: new Date(b.t).toISOString().slice(0, 10),
          close: b.c,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    const trades = backtestCongressSignals(events, priceBarsByTicker);
    const summary = summarizeBacktest(trades);

    return NextResponse.json({ ok: true, tradeCount: trades.length, summary });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Backtest run failed";
    console.error("[backtest/run]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
