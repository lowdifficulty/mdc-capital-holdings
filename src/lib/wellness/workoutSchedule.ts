/** PPL UL — Push / Pull / Lower / Upper / Lower (no rest days); Push on program start day (Jul 5). */

import { routineIdForSplitDay, type RoutineId } from "@/lib/wellness/workoutRoutines";
import { daysSinceProgramStart, isProgramDay } from "@/lib/wellness/programStart";
import {
  DEFAULT_WORKOUT_SCHEDULE_LAG_DAYS,
  getWorkoutScheduleLagDays,
} from "@/lib/wellness/workoutScheduleStore";

/** @deprecated Use getWorkoutScheduleLagDays() — kept for initial Jul 5 miss default. */
export const WORKOUT_SCHEDULE_LAG_DAYS = DEFAULT_WORKOUT_SCHEDULE_LAG_DAYS;

export type WorkoutType = "push" | "pull" | "lower" | "upper" | "rest";

export interface WorkoutDay {
  date: string;
  type: WorkoutType;
  label: string;
  focus: string;
  routineId: RoutineId | null;
}

const SPLIT: { type: WorkoutType; label: string; focus: string }[] = [
  { type: "push", label: "Push", focus: "Chest, shoulders, triceps" },
  { type: "pull", label: "Pull", focus: "Back, biceps, rear delts" },
  { type: "lower", label: "Lower", focus: "Quads, hamstrings, glutes, calves" },
  { type: "upper", label: "Upper", focus: "Chest, back, shoulders, arms" },
  { type: "lower", label: "Lower", focus: "Legs — hinge & squat emphasis" },
];

/** Split anchored to program start — day 0 is Push (minus lag from skipped gym days). */
export function workoutForDate(dateIso: string, lagDays?: number): WorkoutDay | null {
  if (!isProgramDay(dateIso)) return null;
  const lag =
    lagDays ??
    (typeof window !== "undefined" ? getWorkoutScheduleLagDays() : DEFAULT_WORKOUT_SCHEDULE_LAG_DAYS);
  const dayIndex = Math.max(0, daysSinceProgramStart(dateIso) - lag);
  const slot = SPLIT[dayIndex % SPLIT.length] ?? SPLIT[0];
  const routineId = routineIdForSplitDay(dayIndex);
  return { date: dateIso, ...slot, routineId };
}

export function workoutsForRange(startIso: string, days: number): WorkoutDay[] {
  const [y, m, d] = startIso.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const out: WorkoutDay[] = [];
  for (let i = 0; i < days; i++) {
    const cur = new Date(start);
    cur.setDate(cur.getDate() + i);
    const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
    const w = workoutForDate(iso);
    if (w) out.push(w);
  }
  return out;
}

export const WORKOUT_COLORS: Record<WorkoutType, string> = {
  push: "border-purple-400/40 bg-purple-500/10 text-purple-200",
  pull: "border-blue-400/40 bg-blue-500/10 text-blue-200",
  lower: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
  upper: "border-violet-400/40 bg-violet-500/10 text-violet-200",
  rest: "border-white/15 bg-white/5 text-white/50",
};

export const WORKOUT_CELL_TEXT: Record<WorkoutType, string> = {
  push: "text-purple-300",
  pull: "text-blue-300",
  lower: "text-emerald-300",
  upper: "text-violet-300",
  rest: "text-white/40",
};

export { incrementWorkoutScheduleLagDays, getWorkoutScheduleLagDays } from "@/lib/wellness/workoutScheduleStore";
