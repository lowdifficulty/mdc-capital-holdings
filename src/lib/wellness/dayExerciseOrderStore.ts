import { markWellnessDirty } from "@/lib/wellness/syncNotify";

/** Cardio row id — always part of the daily workout checklist. */
export const DAILY_CARDIO_ID = "daily-cardio";

const ORDER_KEY = "mdc-day-exercise-order";

function storageKey(dateIso: string, routineId: string): string {
  return `${dateIso}|${routineId}`;
}

function readAll(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string[]>;
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, string[]>): void {
  localStorage.setItem(ORDER_KEY, JSON.stringify(data));
  markWellnessDirty();
}

function normalizeOrder(stored: string[], defaultIds: string[]): string[] {
  const allowed = new Set(defaultIds);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of stored) {
    if (!allowed.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  for (const id of defaultIds) {
    if (!seen.has(id)) out.push(id);
  }
  return out;
}

export function defaultExerciseOrder(exerciseIds: string[]): string[] {
  return [DAILY_CARDIO_ID, ...exerciseIds];
}

export function getDayExerciseOrder(
  dateIso: string,
  routineId: string,
  exerciseIds: string[]
): string[] {
  const defaultIds = defaultExerciseOrder(exerciseIds);
  const stored = readAll()[storageKey(dateIso, routineId)];
  if (!stored?.length) return defaultIds;
  return normalizeOrder(stored, defaultIds);
}

export function saveDayExerciseOrder(
  dateIso: string,
  routineId: string,
  order: string[],
  exerciseIds: string[]
): void {
  const all = readAll();
  all[storageKey(dateIso, routineId)] = normalizeOrder(order, defaultExerciseOrder(exerciseIds));
  writeAll(all);
}

export function reorderDayExercises(
  dateIso: string,
  routineId: string,
  exerciseIds: string[],
  draggedId: string,
  targetId: string
): string[] {
  const current = getDayExerciseOrder(dateIso, routineId, exerciseIds);
  const from = current.indexOf(draggedId);
  const to = current.indexOf(targetId);
  if (from < 0 || to < 0 || from === to) return current;
  const next = [...current];
  next.splice(from, 1);
  next.splice(to, 0, draggedId);
  saveDayExerciseOrder(dateIso, routineId, next, exerciseIds);
  return next;
}
