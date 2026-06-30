import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { analyzeTicker } from "@/lib/intelligence/engine";
import { getSettings } from "@/lib/intelligence/store";

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
  const settings = await getSettings();
  const rec = await analyzeTicker(symbol, settings);
  if (!rec) return NextResponse.json({ error: "Analysis failed" }, { status: 404 });
  return NextResponse.json(rec);
}
