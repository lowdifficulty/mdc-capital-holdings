import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { findCongressClusters } from "@/lib/analysis/congressScoring";
import { getAllCongressEvents } from "@/lib/quiver/store";

export async function GET(request: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const windowDays = Number(new URL(request.url).searchParams.get("window") ?? 30);
  const events = await getAllCongressEvents();
  const clusters = findCongressClusters(events, windowDays);

  return NextResponse.json({ windowDays, clusters });
}
