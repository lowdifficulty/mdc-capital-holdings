import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import {
  getWellnessForUser,
  getWellnessStorageMode,
  isWellnessStorageDurable,
  saveWellnessForUser,
} from "@/lib/wellness/serverStore";
import { emptyWellnessData, type WellnessData } from "@/lib/wellness/types";

function isWellnessData(value: unknown): value is WellnessData {
  if (!value || typeof value !== "object") return false;
  const data = value as WellnessData;
  return (
    Array.isArray(data.peptideCheckoffs) &&
    Array.isArray(data.workoutCheckoffs) &&
    Array.isArray(data.cardioCheckoffs) &&
    Array.isArray(data.mealCheckoffs) &&
    typeof data.dayJournals === "object" &&
    Array.isArray(data.daySectionOrder) &&
    typeof data.dayExerciseOrder === "object" &&
    typeof data.workoutExerciseLogs === "object" &&
    typeof data.dailyBodyMetrics === "object"
  );
}

export async function GET() {
  try {
    const user = await requireUser();
    const data = await getWellnessForUser(user.email);
    return NextResponse.json({
      data,
      storage: getWellnessStorageMode(),
      durable: isWellnessStorageDurable(),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { data?: unknown };
    if (!isWellnessData(body.data)) {
      return NextResponse.json({ error: "Invalid wellness payload" }, { status: 400 });
    }

    const incoming: WellnessData = {
      ...emptyWellnessData(body.data.updatedAt ?? new Date(0).toISOString()),
      ...body.data,
      updatedAt: body.data.updatedAt ?? new Date().toISOString(),
    };

    const saved = await saveWellnessForUser(user.email, incoming);
    return NextResponse.json({
      data: saved,
      storage: getWellnessStorageMode(),
      durable: isWellnessStorageDurable(),
    });
  } catch (err) {
    console.error("wellness save failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save wellness data" },
      { status: 500 }
    );
  }
}
