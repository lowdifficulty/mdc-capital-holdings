import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getEventsForTicker } from "@/lib/quiver/store";

export async function GET(
  request: Request,
  context: { params: Promise<{ ticker: string }> }
) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ticker } = await context.params;
  const limit = Number(new URL(request.url).searchParams.get("limit") ?? 200);
  const events = await getEventsForTicker(ticker, Math.min(limit, 500));

  return NextResponse.json({ ticker: ticker.toUpperCase(), events, count: events.length });
}
