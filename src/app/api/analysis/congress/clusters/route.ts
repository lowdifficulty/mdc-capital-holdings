import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { findCongressClusters } from "@/lib/analysis/congressScoring";
import { getAllEvents } from "@/lib/quiver/store";

export async function GET(request: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const windowDays = Number(new URL(request.url).searchParams.get("window") ?? 30);
  const events = await getAllEvents(10_000);
  const clusters = findCongressClusters(events, windowDays);

  return NextResponse.json({ windowDays, clusters });
}
