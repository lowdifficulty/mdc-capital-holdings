import type { DayJournal } from "@/lib/wellness/dayJournalStore";
import type { DaySectionId } from "@/lib/wellness/daySectionOrderStore";
import type { DailyBodyMetrics, ExerciseLog } from "@/lib/wellness/workoutLogStore";

export interface WellnessData {
  peptideCheckoffs: string[];
  workoutCheckoffs: string[];
  cardioCheckoffs: string[];
  mealCheckoffs: string[];
  custodyPickupCheckoffs: string[];
  dayJournals: Record<string, DayJournal>;
  daySectionOrder: DaySectionId[];
  dayExerciseOrder: Record<string, string[]>;
  workoutExerciseLogs: Record<string, ExerciseLog>;
  dailyBodyMetrics: Record<string, DailyBodyMetrics>;
  updatedAt: string;
}

export const WELLNESS_LOCAL_KEYS = {
  peptideCheckoffs: "mdc-peptide-checkoffs",
  workoutCheckoffs: "mdc-workout-checkoffs",
  cardioCheckoffs: "mdc-cardio-checkoffs",
  mealCheckoffs: "mdc-meal-checkoffs",
  custodyPickupCheckoffs: "mdc-custody-pickup-checkoffs",
  dayJournals: "mdc-day-journals",
  daySectionOrder: "mdc-day-section-order",
  dayExerciseOrder: "mdc-day-exercise-order",
  workoutExerciseLogs: "mdc-workout-exercise-logs",
  dailyBodyMetrics: "mdc-daily-body-metrics",
} as const;

export const WELLNESS_META_KEY = "mdc-wellness-sync-meta";

export interface WellnessSyncMeta {
  updatedAt: string;
  lastSyncedAt: string | null;
}

export function emptyWellnessData(updatedAt = new Date(0).toISOString()): WellnessData {
  return {
    peptideCheckoffs: [],
    workoutCheckoffs: [],
    cardioCheckoffs: [],
    mealCheckoffs: [],
    custodyPickupCheckoffs: [],
    dayJournals: {},
    daySectionOrder: ["custody", "workout", "meal", "todo", "peptides", "notes"],
    dayExerciseOrder: {},
    workoutExerciseLogs: {},
    dailyBodyMetrics: {},
    updatedAt,
  };
}
