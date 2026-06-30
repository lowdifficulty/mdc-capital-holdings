import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { enrichPositions } from "@/lib/positions/enrich";
import {
  addPosition,
  getPositions,
  removePosition,
  updatePosition,
} from "@/lib/positions/sessionStore";

export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const positions = await getPositions();
  const report = await enrichPositions(positions);
  return NextResponse.json(report);
}

export async function POST(request: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    symbol?: string;
    shares?: number;
    avgCost?: number;
  };
  if (!body.symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  await addPosition(body.symbol, body.shares ?? 0, body.avgCost ?? 0);
  const positions = await getPositions();
  const report = await enrichPositions(positions);
  return NextResponse.json(report);
}

export async function PATCH(request: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    symbol?: string;
    shares?: number;
    avgCost?: number;
  };
  if (!body.symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }
  if (body.shares == null || body.avgCost == null) {
    return NextResponse.json({ error: "shares and avgCost required" }, { status: 400 });
  }

  await updatePosition(body.symbol, body.shares, body.avgCost);
  const positions = await getPositions();
  const report = await enrichPositions(positions);
  return NextResponse.json(report);
}

export async function DELETE(request: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  await removePosition(symbol);
  const positions = await getPositions();
  const report = await enrichPositions(positions);
  return NextResponse.json(report);
}
