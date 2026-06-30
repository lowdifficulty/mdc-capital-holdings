import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getLastRun, getStoreMeta } from "@/lib/quiver/store";

export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [run, meta] = await Promise.all([getLastRun(), getStoreMeta()]);
  return NextResponse.json({ lastRun: run, store: meta });
}
