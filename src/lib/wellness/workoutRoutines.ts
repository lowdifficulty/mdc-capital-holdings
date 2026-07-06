export type RoutineId = "push" | "pull" | "legs" | "upper" | "lower";

export interface ExerciseTemplate {
  id: string;
  name: string;
  setsReps: string;
}

export interface WorkoutRoutine {
  id: RoutineId;
  title: string;
  exercises: ExerciseTemplate[];
}

export const WORKOUT_ROUTINES: Record<RoutineId, WorkoutRoutine> = {
  push: {
    id: "push",
    title: "Best Push Routine",
    exercises: [
      { id: "push-incline-db-press", name: "Incline dumbbell press", setsReps: "4 sets of 6–10" },
      { id: "push-flat-bench", name: "Flat bench press or machine chest press", setsReps: "3 sets of 6–10" },
      { id: "push-seated-shoulder-press", name: "Seated shoulder press", setsReps: "3 sets of 8–12" },
      { id: "push-cable-flys", name: "Cable flys or pec deck", setsReps: "3 sets of 10–15" },
      { id: "push-lateral-raises", name: "Dumbbell or cable lateral raises", setsReps: "4 sets of 12–20" },
      { id: "push-rope-pushdowns", name: "Rope triceps pushdowns", setsReps: "3 sets of 10–15" },
      { id: "push-overhead-triceps", name: "Overhead cable triceps extensions", setsReps: "3 sets of 10–15" },
    ],
  },
  pull: {
    id: "pull",
    title: "Best Pull Routine",
    exercises: [
      { id: "pull-pullups", name: "Pull-ups or lat pulldowns", setsReps: "4 sets of 6–10" },
      { id: "pull-barbell-rows", name: "Barbell rows or chest-supported rows", setsReps: "4 sets of 6–10" },
      { id: "pull-cable-rows", name: "Seated cable rows", setsReps: "3 sets of 8–12" },
      { id: "pull-db-rows", name: "Single-arm dumbbell rows", setsReps: "3 sets of 8–12 each side" },
      { id: "pull-face-pulls", name: "Face pulls or rear delt flys", setsReps: "4 sets of 12–20" },
      { id: "pull-barbell-curls", name: "Barbell curls or EZ-bar curls", setsReps: "3 sets of 8–12" },
      { id: "pull-hammer-curls", name: "Hammer curls", setsReps: "3 sets of 10–15" },
    ],
  },
  legs: {
    id: "legs",
    title: "Best Legs Routine",
    exercises: [
      { id: "legs-squats", name: "Back squats or hack squats", setsReps: "4 sets of 6–10" },
      { id: "legs-rdl", name: "Romanian deadlifts", setsReps: "4 sets of 6–10" },
      { id: "legs-leg-press", name: "Leg press", setsReps: "3 sets of 10–15" },
      { id: "legs-lunges", name: "Walking lunges or Bulgarian split squats", setsReps: "3 sets of 8–12 each leg" },
      { id: "legs-leg-curls", name: "Leg curls", setsReps: "3 sets of 10–15" },
      { id: "legs-leg-extensions", name: "Leg extensions", setsReps: "3 sets of 10–15" },
      { id: "legs-calves", name: "Standing or seated calf raises", setsReps: "4 sets of 12–20" },
    ],
  },
  upper: {
    id: "upper",
    title: "Best Upper Routine",
    exercises: [
      { id: "upper-incline-db-press", name: "Incline dumbbell press", setsReps: "4 sets of 6–10" },
      { id: "upper-pullups", name: "Pull-ups or lat pulldowns", setsReps: "4 sets of 6–10" },
      { id: "upper-flat-bench", name: "Flat bench press or machine chest press", setsReps: "3 sets of 8–12" },
      { id: "upper-rows", name: "Chest-supported rows or seated cable rows", setsReps: "3 sets of 8–12" },
      { id: "upper-shoulder-press", name: "Seated dumbbell shoulder press", setsReps: "3 sets of 8–12" },
      { id: "upper-lateral-raises", name: "Dumbbell or cable lateral raises", setsReps: "4 sets of 12–20" },
      { id: "upper-triceps", name: "Rope triceps pushdowns", setsReps: "3 sets of 10–15" },
      { id: "upper-curls", name: "EZ-bar curls or hammer curls", setsReps: "3 sets of 10–15" },
    ],
  },
  lower: {
    id: "lower",
    title: "Best Lower Routine",
    exercises: [
      { id: "lower-squats", name: "Back squats or hack squats", setsReps: "4 sets of 6–10" },
      { id: "lower-rdl", name: "Romanian deadlifts", setsReps: "4 sets of 6–10" },
      { id: "lower-leg-press", name: "Leg press", setsReps: "3 sets of 10–15" },
      { id: "lower-split-squats", name: "Bulgarian split squats or walking lunges", setsReps: "3 sets of 8–12 each leg" },
      { id: "lower-leg-curls", name: "Leg curls", setsReps: "3 sets of 10–15" },
      { id: "lower-leg-extensions", name: "Leg extensions", setsReps: "3 sets of 10–15" },
      { id: "lower-calves", name: "Standing or seated calf raises", setsReps: "4 sets of 12–20" },
    ],
  },
};

/** PPL UL split day index → routine (5-day cycle, no rest). */
const SPLIT_ROUTINE: RoutineId[] = ["push", "pull", "legs", "upper", "lower"];

export function routineIdForSplitDay(dayIndex: number): RoutineId | null {
  return SPLIT_ROUTINE[dayIndex % SPLIT_ROUTINE.length] ?? null;
}
