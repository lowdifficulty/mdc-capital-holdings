const WORKOUT_LOG_KEY = "mdc-workout-exercise-logs";

export interface ExerciseLog {
  done: boolean;
  weightNote: string;
}

type LogStore = Record<string, ExerciseLog>;

function logKey(dateIso: string, exerciseId: string): string {
  return `${dateIso}:${exerciseId}`;
}

function readAll(): LogStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(WORKOUT_LOG_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as LogStore;
  } catch {
    return {};
  }
}

function writeAll(data: LogStore): void {
  localStorage.setItem(WORKOUT_LOG_KEY, JSON.stringify(data));
}

export function getExerciseLog(dateIso: string, exerciseId: string): ExerciseLog {
  const all = readAll();
  return all[logKey(dateIso, exerciseId)] ?? { done: false, weightNote: "" };
}

export function getExerciseLogsForDay(dateIso: string, exerciseIds: string[]): Record<string, ExerciseLog> {
  const all = readAll();
  const out: Record<string, ExerciseLog> = {};
  for (const id of exerciseIds) {
    out[id] = all[logKey(dateIso, id)] ?? { done: false, weightNote: "" };
  }
  return out;
}

export function saveExerciseLog(
  dateIso: string,
  exerciseId: string,
  patch: Partial<ExerciseLog>
): ExerciseLog {
  const all = readAll();
  const key = logKey(dateIso, exerciseId);
  const current = all[key] ?? { done: false, weightNote: "" };
  const next = { ...current, ...patch };
  all[key] = next;
  writeAll(all);
  return next;
}

export function toggleExerciseDone(dateIso: string, exerciseId: string): ExerciseLog {
  const current = getExerciseLog(dateIso, exerciseId);
  return saveExerciseLog(dateIso, exerciseId, { done: !current.done });
}

const DAILY_WEIGHT_KEY = "mdc-daily-body-weight";

type DailyWeightStore = Record<string, string>;

function readWeights(): DailyWeightStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DAILY_WEIGHT_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as DailyWeightStore;
  } catch {
    return {};
  }
}

function writeWeights(data: DailyWeightStore): void {
  localStorage.setItem(DAILY_WEIGHT_KEY, JSON.stringify(data));
}

export function getDailyBodyWeight(dateIso: string): string {
  return readWeights()[dateIso] ?? "";
}

export function saveDailyBodyWeight(dateIso: string, weight: string): void {
  const all = readWeights();
  all[dateIso] = weight;
  writeWeights(all);
}
