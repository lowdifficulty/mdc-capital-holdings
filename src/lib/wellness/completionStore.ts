import { markWellnessDirty } from "@/lib/wellness/syncNotify";

const PEPTIDE_KEY = "mdc-peptide-checkoffs";
const WORKOUT_KEY = "mdc-workout-checkoffs";
const CARDIO_KEY = "mdc-cardio-checkoffs";
const MEAL_KEY = "mdc-meal-checkoffs";
const CUSTODY_PICKUP_KEY = "mdc-custody-pickup-checkoffs";

export const DAILY_CARDIO_LABEL = "30 minutes of cardio";

function readSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeSet(key: string, ids: Set<string>): void {
  localStorage.setItem(key, JSON.stringify([...ids]));
  markWellnessDirty();
}

export function getPeptideCompleted(): Set<string> {
  return readSet(PEPTIDE_KEY);
}

export function togglePeptideCompleted(id: string): Set<string> {
  const set = readSet(PEPTIDE_KEY);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  writeSet(PEPTIDE_KEY, set);
  return set;
}

export function getWorkoutCompleted(): Set<string> {
  return readSet(WORKOUT_KEY);
}

export function toggleWorkoutCompleted(dateIso: string): Set<string> {
  const set = readSet(WORKOUT_KEY);
  if (set.has(dateIso)) set.delete(dateIso);
  else set.add(dateIso);
  writeSet(WORKOUT_KEY, set);
  return set;
}

export function getCardioCompleted(): Set<string> {
  return readSet(CARDIO_KEY);
}

export function toggleCardioCompleted(dateIso: string): Set<string> {
  const set = readSet(CARDIO_KEY);
  if (set.has(dateIso)) set.delete(dateIso);
  else set.add(dateIso);
  writeSet(CARDIO_KEY, set);
  return set;
}

export function getMealCompleted(): Set<string> {
  return readSet(MEAL_KEY);
}

export function toggleMealCompleted(id: string): Set<string> {
  const set = readSet(MEAL_KEY);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  writeSet(MEAL_KEY, set);
  return set;
}

export function getCustodyPickupCompleted(): Set<string> {
  return readSet(CUSTODY_PICKUP_KEY);
}

export function toggleCustodyPickupCompleted(dateIso: string): Set<string> {
  const set = readSet(CUSTODY_PICKUP_KEY);
  if (set.has(dateIso)) set.delete(dateIso);
  else set.add(dateIso);
  writeSet(CUSTODY_PICKUP_KEY, set);
  return set;
}
