const WORKOUT_LOG_KEY = "mdc-workout-exercise-logs";

export const SET_COUNT = 4;

export interface ExerciseLog {
  done: boolean;
  setWeights: string[];
  /** @deprecated Migrated into setWeights[0] */
  weightNote?: string;
}

export function emptySetWeights(): string[] {
  return Array.from({ length: SET_COUNT }, () => "");
}

function normalizeLog(raw: Partial<ExerciseLog> | null | undefined): ExerciseLog {
  const sets =
    raw?.setWeights?.length === SET_COUNT ? [...raw.setWeights] : emptySetWeights();
  if (!sets.some((s) => s.trim()) && raw?.weightNote?.trim()) {
    sets[0] = raw.weightNote.trim();
  }
  return { done: !!raw?.done, setWeights: sets };
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
  return normalizeLog(all[logKey(dateIso, exerciseId)]);
}

export function getExerciseLogsForDay(dateIso: string, exerciseIds: string[]): Record<string, ExerciseLog> {
  const all = readAll();
  const out: Record<string, ExerciseLog> = {};
  for (const id of exerciseIds) {
    out[id] = normalizeLog(all[logKey(dateIso, id)]);
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
  const current = normalizeLog(all[key]);
  const merged = { ...current, ...patch };
  const next = normalizeLog({
    done: merged.done,
    setWeights: merged.setWeights,
  });
  all[key] = next;
  writeAll(all);
  return next;
}

export interface PreviousExerciseSession {
  dateIso: string;
  setWeights: string[];
}

function logsForExercise(exerciseId: string): PreviousExerciseSession[] {
  const all = readAll();
  const suffix = `:${exerciseId}`;
  const out: PreviousExerciseSession[] = [];
  for (const [key, raw] of Object.entries(all)) {
    if (!key.endsWith(suffix)) continue;
    const dateIso = key.slice(0, -suffix.length);
    const log = normalizeLog(raw);
    if (log.setWeights.some((s) => s.trim())) {
      out.push({ dateIso, setWeights: log.setWeights });
    }
  }
  return out.sort((a, b) => b.dateIso.localeCompare(a.dateIso));
}

/** Most recent session for this exercise before the given date. */
export function getPreviousExerciseSession(
  exerciseId: string,
  beforeDateIso: string
): PreviousExerciseSession | null {
  return logsForExercise(exerciseId).find((s) => s.dateIso < beforeDateIso) ?? null;
}

export function getRecommendedSets(exerciseId: string, beforeDateIso: string): string[] {
  const prev = getPreviousExerciseSession(exerciseId, beforeDateIso);
  return prev ? [...prev.setWeights] : emptySetWeights();
}

export function toggleExerciseDone(dateIso: string, exerciseId: string): ExerciseLog {
  const current = getExerciseLog(dateIso, exerciseId);
  return saveExerciseLog(dateIso, exerciseId, { done: !current.done });
}

const DAILY_METRICS_KEY = "mdc-daily-body-metrics";
const DAILY_WEIGHT_KEY = "mdc-daily-body-weight";

export interface DailyBodyMetrics {
  weight: string;
  bmi: string;
  bodyFatPct: string;
  subcutaneousFat: string;
  muscleMass: string;
  locked: boolean;
}

export function emptyBodyMetrics(): DailyBodyMetrics {
  return {
    weight: "",
    bmi: "",
    bodyFatPct: "",
    subcutaneousFat: "",
    muscleMass: "",
    locked: false,
  };
}

type MetricsStore = Record<string, DailyBodyMetrics>;

function readMetrics(): MetricsStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DAILY_METRICS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as MetricsStore;
  } catch {
    return {};
  }
}

function writeMetrics(data: MetricsStore): void {
  localStorage.setItem(DAILY_METRICS_KEY, JSON.stringify(data));
}

function readLegacyWeights(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DAILY_WEIGHT_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export function getDailyBodyMetrics(dateIso: string): DailyBodyMetrics {
  const stored = readMetrics()[dateIso];
  if (stored) return { ...emptyBodyMetrics(), ...stored };

  const legacyWeight = readLegacyWeights()[dateIso];
  if (legacyWeight) {
    return { ...emptyBodyMetrics(), weight: legacyWeight, locked: true };
  }
  return emptyBodyMetrics();
}

export function saveDailyBodyMetrics(dateIso: string, metrics: DailyBodyMetrics): DailyBodyMetrics {
  const all = readMetrics();
  const next = { ...emptyBodyMetrics(), ...metrics, locked: true };
  all[dateIso] = next;
  writeMetrics(all);
  return next;
}

export function getPreviousBodyMetrics(
  beforeDateIso: string
): { dateIso: string; metrics: DailyBodyMetrics } | null {
  const all = readMetrics();
  const dates = Object.keys(all)
    .filter((d) => d < beforeDateIso && all[d]?.locked)
    .sort((a, b) => b.localeCompare(a));
  for (const dateIso of dates) {
    const metrics = { ...emptyBodyMetrics(), ...all[dateIso] };
    const hasData = METRIC_KEYS.some((k) => metrics[k].trim());
    if (hasData) return { dateIso, metrics };
  }
  return null;
}

const METRIC_KEYS: (keyof Omit<DailyBodyMetrics, "locked">)[] = [
  "weight",
  "bmi",
  "bodyFatPct",
  "subcutaneousFat",
  "muscleMass",
];

export function formatMetricDelta(
  current: string,
  previous: string,
  unit: string
): string | null {
  const c = parseFloat(current);
  const p = parseFloat(previous);
  if (!current.trim() || !previous.trim() || Number.isNaN(c) || Number.isNaN(p)) return null;
  const diff = Math.round((c - p) * 10) / 10;
  if (diff === 0) return "No change";
  const sign = diff > 0 ? "+" : "";
  return `${sign}${diff}${unit ? ` ${unit}` : ""}`;
}

/** @deprecated Use getDailyBodyMetrics */
export function getDailyBodyWeight(dateIso: string): string {
  return getDailyBodyMetrics(dateIso).weight;
}

/** @deprecated Use saveDailyBodyMetrics */
export function saveDailyBodyWeight(dateIso: string, weight: string): void {
  const current = getDailyBodyMetrics(dateIso);
  saveDailyBodyMetrics(dateIso, { ...current, weight, locked: true });
}
