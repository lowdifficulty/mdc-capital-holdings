import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { runFullAnalysis } from "@/lib/analysis/engine";

export const maxDuration = 300;

export async function POST() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runFullAnalysis();
    return NextResponse.json({
      ok: true,
      runId: result.ingestion.runId,
      eventsAdded: result.ingestion.eventsAdded,
      tickersScored: result.scores.length,
      errors: result.ingestion.errors,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Analysis run failed";
    console.error("[analysis/run]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
