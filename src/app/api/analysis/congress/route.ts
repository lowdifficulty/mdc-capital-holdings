import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getCongressEvents } from "@/lib/quiver/store";
import { scoreCongressEvent } from "@/lib/analysis/congressScoring";
import { tradeDirection } from "@/lib/quiver/normalize";

export async function GET(request: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = Number(new URL(request.url).searchParams.get("days") ?? 30);
  const events = await getCongressEvents(days);
  const all = await getCongressEvents(365);

  const scored = events
    .map((e) => ({
      ...e,
      sentimentScore: scoreCongressEvent(e, all),
      direction: tradeDirection(e.transactionType) > 0 ? "buy" : tradeDirection(e.transactionType) < 0 ? "sell" : "other",
    }))
    .sort((a, b) => Math.abs(b.sentimentScore) - Math.abs(a.sentimentScore))
    .slice(0, 100);

  return NextResponse.json({ days, trades: scored, count: scored.length });
}
