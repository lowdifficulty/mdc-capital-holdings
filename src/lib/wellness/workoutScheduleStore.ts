import { markWellnessDirty } from "@/lib/wellness/syncNotify";
import { WELLNESS_LOCAL_KEYS } from "@/lib/wellness/types";

/** Default lag — Jul 5, 2026 gym day was missed before program tracking. */
export const DEFAULT_WORKOUT_SCHEDULE_LAG_DAYS = 1;

const LAG_KEY = WELLNESS_LOCAL_KEYS.workoutScheduleLagDays;

export function getWorkoutScheduleLagDays(): number {
  if (typeof window === "undefined") return DEFAULT_WORKOUT_SCHEDULE_LAG_DAYS;
  try {
    const raw = localStorage.getItem(LAG_KEY);
    if (raw == null) return DEFAULT_WORKOUT_SCHEDULE_LAG_DAYS;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_WORKOUT_SCHEDULE_LAG_DAYS;
  } catch {
    return DEFAULT_WORKOUT_SCHEDULE_LAG_DAYS;
  }
}

export function setWorkoutScheduleLagDays(lagDays: number): number {
  const safe =
    Number.isFinite(lagDays) && lagDays >= 0 ? Math.floor(lagDays) : DEFAULT_WORKOUT_SCHEDULE_LAG_DAYS;
  if (typeof window !== "undefined") {
    localStorage.setItem(LAG_KEY, String(safe));
    markWellnessDirty();
  }
  return safe;
}

/** Apply synced lag without marking local data dirty (hydration from server). */
export function applyWorkoutScheduleLagDays(lagDays: number): void {
  if (typeof window === "undefined") return;
  const safe =
    Number.isFinite(lagDays) && lagDays >= 0 ? Math.floor(lagDays) : DEFAULT_WORKOUT_SCHEDULE_LAG_DAYS;
  localStorage.setItem(LAG_KEY, String(safe));
}

/** Skip gym — shift the entire PPLUL split back one day (increment lag). */
export function incrementWorkoutScheduleLagDays(): number {
  return setWorkoutScheduleLagDays(getWorkoutScheduleLagDays() + 1);
}
