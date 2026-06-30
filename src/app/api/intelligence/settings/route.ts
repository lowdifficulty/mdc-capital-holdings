import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getSettings, saveSettings } from "@/lib/intelligence/store";
import type { IntelligenceSettings } from "@/lib/intelligence/types";

export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getSettings());
}

export async function PUT(request: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as Partial<IntelligenceSettings>;
  const current = await getSettings();
  const merged = { ...current, ...body, weights: { ...current.weights, ...body.weights } };
  return NextResponse.json(await saveSettings(merged));
}
