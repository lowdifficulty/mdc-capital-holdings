import type { DayJournal, DayTodo } from "@/lib/wellness/dayJournalStore";
import type { DailyBodyMetrics, ExerciseLog } from "@/lib/wellness/workoutLogStore";
import type { WellnessData } from "@/lib/wellness/types";

function unionStrings(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])];
}

function mergeTodos(a: DayTodo[], b: DayTodo[]): DayTodo[] {
  const byId = new Map<string, DayTodo>();
  for (const todo of [...a, ...b]) {
    const existing = byId.get(todo.id);
    if (!existing) {
      byId.set(todo.id, { ...todo });
      continue;
    }
    byId.set(todo.id, {
      ...existing,
      text: todo.text.trim() ? todo.text : existing.text,
      done: existing.done || todo.done,
    });
  }
  return [...byId.values()];
}

function mergeJournal(a: DayJournal, b: DayJournal): DayJournal {
  const note =
    a.note.trim().length >= b.note.trim().length ? a.note : b.note;
  const noteLocked = a.noteLocked || b.noteLocked;
  const planNotes = { ...a.planNotes, ...b.planNotes };
  for (const key of Object.keys({ ...a.planNotes, ...b.planNotes }) as Array<
    keyof NonNullable<DayJournal["planNotes"]>
  >) {
    const av = a.planNotes?.[key]?.trim() ?? "";
    const bv = b.planNotes?.[key]?.trim() ?? "";
    planNotes[key] = av.length >= bv.length ? av : bv;
  }
  return {
    note,
    noteLocked,
    planNotes,
    todos: mergeTodos(a.todos ?? [], b.todos ?? []),
    custodyTodos: mergeTodos(a.custodyTodos ?? [], b.custodyTodos ?? []),
  };
}

function mergeExerciseLog(a: ExerciseLog, b: ExerciseLog): ExerciseLog {
  const setWeights = a.setWeights.map((weight, index) => {
    const other = b.setWeights[index] ?? "";
    return weight.trim().length >= other.trim().length ? weight : other;
  });
  return {
    done: a.done || b.done,
    setWeights,
  };
}

function mergeBodyMetrics(a: DailyBodyMetrics, b: DailyBodyMetrics): DailyBodyMetrics {
  const pick = (field: keyof Omit<DailyBodyMetrics, "locked">) => {
    const av = a[field]?.trim() ?? "";
    const bv = b[field]?.trim() ?? "";
    return av.length >= bv.length ? av : bv;
  };
  return {
    weight: pick("weight"),
    bmi: pick("bmi"),
    bodyFatPct: pick("bodyFatPct"),
    subcutaneousFat: pick("subcutaneousFat"),
    muscleMass: pick("muscleMass"),
    locked: a.locked || b.locked,
  };
}

function mergeRecords<T>(
  a: Record<string, T>,
  b: Record<string, T>,
  mergeItem: (left: T, right: T) => T
): Record<string, T> {
  const out: Record<string, T> = { ...a };
  for (const [key, value] of Object.entries(b)) {
    out[key] = out[key] ? mergeItem(out[key], value) : value;
  }
  return out;
}

function mergeSectionOrder(a: WellnessData["daySectionOrder"], b: WellnessData["daySectionOrder"]) {
  if (a.length === 0) return [...b];
  if (b.length === 0) return [...a];
  return a.length >= b.length ? [...a] : [...b];
}

export function mergeWellnessData(a: WellnessData, b: WellnessData): WellnessData {
  const updatedAt = a.updatedAt > b.updatedAt ? a.updatedAt : b.updatedAt;
  return {
    peptideCheckoffs: unionStrings(a.peptideCheckoffs, b.peptideCheckoffs),
    workoutCheckoffs: unionStrings(a.workoutCheckoffs, b.workoutCheckoffs),
    cardioCheckoffs: unionStrings(a.cardioCheckoffs, b.cardioCheckoffs),
    mealCheckoffs: unionStrings(a.mealCheckoffs, b.mealCheckoffs),
    custodyPickupCheckoffs: unionStrings(a.custodyPickupCheckoffs ?? [], b.custodyPickupCheckoffs ?? []),
    dayJournals: mergeRecords(a.dayJournals, b.dayJournals, mergeJournal),
    daySectionOrder: mergeSectionOrder(a.daySectionOrder, b.daySectionOrder),
    dayExerciseOrder: mergeRecords(a.dayExerciseOrder, b.dayExerciseOrder, (left, right) => {
      if (left.length === 0) return [...right];
      if (right.length === 0) return [...left];
      return left.length >= right.length ? [...left] : [...right];
    }),
    workoutExerciseLogs: mergeRecords(a.workoutExerciseLogs, b.workoutExerciseLogs, mergeExerciseLog),
    dailyBodyMetrics: mergeRecords(a.dailyBodyMetrics, b.dailyBodyMetrics, mergeBodyMetrics),
    updatedAt,
  };
}

export function wellnessHasContent(data: WellnessData): boolean {
  return (
    data.peptideCheckoffs.length > 0 ||
    data.workoutCheckoffs.length > 0 ||
    data.cardioCheckoffs.length > 0 ||
    data.mealCheckoffs.length > 0 ||
    (data.custodyPickupCheckoffs?.length ?? 0) > 0 ||
    Object.keys(data.dayJournals).length > 0 ||
    Object.keys(data.dayExerciseOrder).length > 0 ||
    Object.keys(data.workoutExerciseLogs).length > 0 ||
    Object.keys(data.dailyBodyMetrics).length > 0
  );
}
