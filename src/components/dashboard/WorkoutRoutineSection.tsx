"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  SET_COUNT,
  emptySetWeights,
  formatMetricDelta,
  getDailyBodyMetrics,
  getExerciseLogsForDay,
  getPreviousBodyMetrics,
  getPreviousExerciseSession,
  getRecommendedSets,
  saveDailyBodyMetrics,
  saveExerciseLog,
  toggleExerciseDone,
  type DailyBodyMetrics,
  type ExerciseLog,
} from "@/lib/wellness/workoutLogStore";
import { DAILY_CARDIO_LABEL } from "@/lib/wellness/completionStore";
import {
  DAILY_CARDIO_ID,
  getDayExerciseOrder,
  reorderDayExercises,
} from "@/lib/wellness/dayExerciseOrderStore";
import { WORKOUT_ROUTINES } from "@/lib/wellness/workoutRoutines";
import type { WorkoutDay } from "@/lib/wellness/workoutSchedule";

const DAY_VIEW_WORKOUT =
  "border-mdc-blue/35 bg-mdc-blue/10 text-blue-100 shadow-sm shadow-mdc-blue/5";
const DAY_VIEW_REST = "border-white/15 bg-white/5 text-white/50";

const INPUT_CLASS =
  "min-h-[44px] w-full rounded-lg border border-mdc-blue/20 bg-mdc-blue/5 px-3 py-2.5 text-base text-white placeholder:text-white/30 outline-none focus:border-mdc-blue/50 focus:ring-1 focus:ring-mdc-blue/20 sm:min-h-0 sm:px-2.5 sm:py-1.5 sm:text-xs";

const SET_INPUT_CLASS =
  "min-h-[40px] w-full rounded-lg border border-mdc-blue/20 bg-mdc-blue/5 px-2 py-2 text-center text-base text-white placeholder:text-white/30 outline-none focus:border-mdc-blue/50 focus:ring-1 focus:ring-mdc-blue/20 sm:min-h-0 sm:py-1.5 sm:text-xs";

function shortDateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatSetsLine(sets: string[]): string {
  return sets.map((s) => (s.trim() ? s.trim() : "—")).join(" / ");
}

const METRIC_FIELDS: {
  key: keyof Omit<DailyBodyMetrics, "locked">;
  label: string;
  unit: string;
  placeholder: string;
}[] = [
  { key: "weight", label: "Body weight", unit: "lb", placeholder: "185" },
  { key: "bmi", label: "BMI", unit: "", placeholder: "24.5" },
  { key: "bodyFatPct", label: "Body fat", unit: "%", placeholder: "18" },
  { key: "subcutaneousFat", label: "Subcutaneous fat", unit: "%", placeholder: "12" },
  { key: "muscleMass", label: "Muscle mass", unit: "lb", placeholder: "145" },
];

function formatMetricsSummary(metrics: DailyBodyMetrics): string {
  const parts: string[] = [];
  for (const field of METRIC_FIELDS) {
    const value = metrics[field.key].trim();
    if (!value) continue;
    if (field.key === "weight") parts.push(`${value} lb`);
    else if (field.key === "bodyFatPct") parts.push(`${value}% BF`);
    else if (field.key === "bmi") parts.push(`BMI ${value}`);
    else parts.push(`${value}${field.unit ? ` ${field.unit}` : ""}`);
  }
  return parts.join(" · ");
}

function DailyBodyMetricsPanel({ iso, embedded }: { iso: string; embedded?: boolean }) {
  const [metrics, setMetrics] = useState<DailyBodyMetrics>(() => getDailyBodyMetrics(iso));
  const [editing, setEditing] = useState(() => !getDailyBodyMetrics(iso).locked);
  const [expanded, setExpanded] = useState(() => {
    const loaded = getDailyBodyMetrics(iso);
    const hasAny = METRIC_FIELDS.some((f) => loaded[f.key].trim());
    return !loaded.locked || !hasAny;
  });

  useEffect(() => {
    const loaded = getDailyBodyMetrics(iso);
    const hasAny = METRIC_FIELDS.some((f) => loaded[f.key].trim());
    setMetrics(loaded);
    setEditing(!loaded.locked);
    setExpanded(!loaded.locked || !hasAny);
  }, [iso]);

  function updateField(key: keyof Omit<DailyBodyMetrics, "locked">, value: string) {
    setMetrics((m) => ({ ...m, [key]: value }));
  }

  function handleSave() {
    const saved = saveDailyBodyMetrics(iso, metrics);
    setMetrics(saved);
    setEditing(false);
    setExpanded(false);
  }

  function handleEdit() {
    setEditing(true);
    setExpanded(true);
  }

  const hasAnyValue = METRIC_FIELDS.some((f) => metrics[f.key].trim());
  const previous = !editing ? getPreviousBodyMetrics(iso) : null;
  const summary = formatMetricsSummary(metrics);

  return (
    <div className={`px-0 py-3 sm:py-2.5 ${embedded ? "" : "border-t border-mdc-blue/20 px-3"}`}>
      <button
        type="button"
        onClick={() => setExpanded((o) => !o)}
        className="touch-manipulation flex w-full items-start justify-between gap-2 text-left active:opacity-90"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-200/70">
            Body composition
          </p>
          {!expanded && (
            <p className="mt-1 text-xs text-blue-200/60">
              {hasAnyValue ? summary : "No metrics saved — tap to add"}
            </p>
          )}
        </div>
        <span className="shrink-0 pt-0.5 text-sm text-blue-200/50">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="mt-2">
          <div className="mb-2 flex justify-end">
            {editing ? (
              <button
                type="button"
                onClick={handleSave}
                className="touch-manipulation min-h-[36px] rounded-lg bg-mdc-blue px-3 py-1.5 text-xs font-semibold text-white active:opacity-90"
              >
                Save
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEdit}
                className="touch-manipulation min-h-[36px] rounded-lg border border-mdc-blue/30 px-3 py-1.5 text-xs font-semibold text-blue-200 active:bg-mdc-blue/10"
              >
                Edit
              </button>
            )}
          </div>

          {!editing && !hasAnyValue ? (
            <p className="text-xs text-blue-200/40">No metrics saved — tap Edit to add.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {METRIC_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="block text-[10px] text-blue-200/60">{field.label}</label>
                  {editing ? (
                    <div className="mt-1 flex items-center gap-1.5">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={metrics[field.key]}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className={INPUT_CLASS}
                      />
                      {field.unit && (
                        <span className="shrink-0 text-xs text-blue-200/50">{field.unit}</span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-1">
                      <p className="text-sm font-medium tabular-nums text-white/90">
                        {metrics[field.key].trim() ? (
                          <>
                            {metrics[field.key]}
                            {field.unit && <span className="ml-0.5 text-xs text-blue-200/50">{field.unit}</span>}
                          </>
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </p>
                      {previous && metrics[field.key].trim() && previous.metrics[field.key].trim() && (
                        <p className="mt-0.5 text-[10px] text-blue-200/50">
                          vs {shortDateLabel(previous.dateIso)}:{" "}
                          {formatMetricDelta(metrics[field.key], previous.metrics[field.key], field.unit) ??
                            "—"}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExerciseSetInputs({
  iso,
  exerciseId,
  log,
  onSetsChange,
}: {
  iso: string;
  exerciseId: string;
  log: ExerciseLog;
  onSetsChange: (exerciseId: string, setWeights: string[]) => void;
}) {
  const previous = getPreviousExerciseSession(exerciseId, iso);
  const recommended = getRecommendedSets(exerciseId, iso);
  const sets = log.setWeights.length === SET_COUNT ? log.setWeights : emptySetWeights();

  function updateSet(index: number, value: string) {
    const next = [...sets];
    next[index] = value;
    onSetsChange(exerciseId, next);
  }

  function saveSets(next: string[]) {
    saveExerciseLog(iso, exerciseId, { setWeights: next });
  }

  function applyLastSession() {
    if (!previous) return;
    onSetsChange(exerciseId, [...previous.setWeights]);
    saveSets([...previous.setWeights]);
  }

  return (
    <div className="mt-2">
      {previous && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-mdc-blue/15 bg-mdc-blue/5 px-2 py-1.5">
          <p className="text-[10px] leading-snug text-blue-200/70">
            Last ({shortDateLabel(previous.dateIso)}): {formatSetsLine(previous.setWeights)}
          </p>
          <button
            type="button"
            onClick={applyLastSession}
            className="touch-manipulation shrink-0 rounded-md border border-mdc-blue/30 px-2 py-1 text-[10px] font-semibold text-blue-200 active:bg-mdc-blue/15"
          >
            Use last
          </button>
        </div>
      )}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {sets.map((weight, i) => (
          <div key={i}>
            <label className="mb-0.5 block text-center text-[9px] text-blue-200/50">Set {i + 1}</label>
            <input
              type="text"
              inputMode="decimal"
              value={weight}
              onChange={(e) => updateSet(i, e.target.value)}
              onBlur={(e) => {
                const next = [...sets];
                next[i] = e.target.value;
                saveSets(next);
              }}
              placeholder={recommended[i]?.trim() || "lb"}
              className={SET_INPUT_CLASS}
            />
            {previous && weight.trim() && previous.setWeights[i]?.trim() && (
              <p className="mt-0.5 text-center text-[9px] text-blue-200/45">
                {formatMetricDelta(weight, previous.setWeights[i], "lb") ?? "—"}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface WorkoutRoutineSectionProps {
  iso: string;
  workout: WorkoutDay;
  workoutDone: boolean;
  cardioDone: boolean;
  onToggleWorkout: (dateIso: string) => void;
  onToggleCardio: (dateIso: string) => void;
  embedded?: boolean;
}

export default function WorkoutRoutineSection({
  iso,
  workout,
  workoutDone,
  cardioDone,
  onToggleWorkout,
  onToggleCardio,
  embedded = false,
}: WorkoutRoutineSectionProps) {
  const [open, setOpen] = useState(false);
  const routine = workout.routineId ? WORKOUT_ROUTINES[workout.routineId] : null;
  const exerciseIds = useMemo(() => routine?.exercises.map((e) => e.id) ?? [], [routine]);

  const [logs, setLogs] = useState<Record<string, ExerciseLog>>({});
  const [exerciseOrder, setExerciseOrder] = useState<string[]>([]);
  const [dragExerciseId, setDragExerciseId] = useState<string | null>(null);
  const [dragOverExerciseId, setDragOverExerciseId] = useState<string | null>(null);

  const reloadLogs = useCallback(() => {
    if (!exerciseIds.length) {
      setLogs({});
      return;
    }
    setLogs(getExerciseLogsForDay(iso, exerciseIds));
  }, [iso, exerciseIds]);

  useEffect(() => {
    reloadLogs();
    if (!embedded) setOpen(false);
  }, [iso, reloadLogs, embedded]);

  useEffect(() => {
    if (!workout.routineId || !exerciseIds.length) {
      setExerciseOrder([]);
      return;
    }
    setExerciseOrder(getDayExerciseOrder(iso, workout.routineId, exerciseIds));
  }, [iso, workout.routineId, exerciseIds]);

  const orderedExerciseIds = useMemo(() => {
    if (!exerciseOrder.length) return [DAILY_CARDIO_ID, ...exerciseIds];
    return exerciseOrder;
  }, [exerciseOrder, exerciseIds]);

  function handleExerciseDrop(targetId: string) {
    if (!workout.routineId || !dragExerciseId || dragExerciseId === targetId) return;
    const next = reorderDayExercises(iso, workout.routineId, exerciseIds, dragExerciseId, targetId);
    setExerciseOrder(next);
    setDragExerciseId(null);
    setDragOverExerciseId(null);
  }

  const doneCount = exerciseIds.filter((id) => logs[id]?.done).length;
  const total = exerciseIds.length;
  const checklistDone = doneCount + (cardioDone ? 1 : 0);
  const checklistTotal = total + 1;

  function syncWorkoutDone(nextLogs: Record<string, ExerciseLog>, cardio: boolean) {
    if (!exerciseIds.length) return;
    const allDone = exerciseIds.every((id) => nextLogs[id]?.done) && cardio;
    if (allDone && !workoutDone) onToggleWorkout(iso);
    else if (!allDone && workoutDone) onToggleWorkout(iso);
  }

  function handleToggleExercise(exerciseId: string) {
    toggleExerciseDone(iso, exerciseId);
    const next = getExerciseLogsForDay(iso, exerciseIds);
    setLogs(next);
    syncWorkoutDone(next, cardioDone);
  }

  function handleToggleCardio() {
    onToggleCardio(iso);
    const nextCardio = !cardioDone;
    syncWorkoutDone(logs, nextCardio);
  }

  function handleSetsChange(exerciseId: string, setWeights: string[]) {
    setLogs((prev) => ({
      ...prev,
      [exerciseId]: { ...(prev[exerciseId] ?? { done: false, setWeights: emptySetWeights() }), setWeights },
    }));
  }

  const exerciseList = routine ? (
    <ul className="space-y-2">
      {orderedExerciseIds.map((itemId) => {
        const dragShell =
          dragExerciseId === itemId ? "opacity-50" : dragOverExerciseId === itemId ? "ring-2 ring-mdc-blue/40" : "";

        if (itemId === DAILY_CARDIO_ID) {
          return (
            <li
              key={itemId}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragExerciseId && dragExerciseId !== itemId) setDragOverExerciseId(itemId);
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleExerciseDrop(itemId);
              }}
              className={`rounded-xl border border-mdc-blue/15 bg-mdc-blue/5 p-3 transition ${dragShell}`}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", itemId);
                    setDragExerciseId(itemId);
                  }}
                  onDragEnd={() => {
                    setDragExerciseId(null);
                    setDragOverExerciseId(null);
                  }}
                  className="touch-manipulation mt-0.5 flex h-8 w-6 shrink-0 cursor-grab items-center justify-center text-white/30 active:cursor-grabbing active:text-white/50"
                  aria-label="Drag to reorder cardio"
                >
                  <span className="text-sm leading-none tracking-tighter">⋮⋮</span>
                </button>
                <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={cardioDone}
                    onChange={handleToggleCardio}
                    className="mt-1 h-5 w-5 shrink-0 rounded border-white/30 accent-mdc-blue"
                  />
                  <div className="min-w-0 flex-1">
                    <span
                      className={`block text-base font-semibold leading-snug sm:text-sm ${cardioDone ? "text-white/40 line-through" : "text-white"}`}
                    >
                      {DAILY_CARDIO_LABEL}
                    </span>
                    <span className={`mt-0.5 block text-sm sm:text-xs ${cardioDone ? "text-white/30" : "text-white/50"}`}>
                      Steady-state or intervals — any modality
                    </span>
                  </div>
                </label>
              </div>
            </li>
          );
        }

        const ex = routine.exercises.find((e) => e.id === itemId);
        if (!ex) return null;
        const log = logs[ex.id] ?? { done: false, setWeights: emptySetWeights() };
        return (
          <li
            key={ex.id}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragExerciseId && dragExerciseId !== ex.id) setDragOverExerciseId(ex.id);
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleExerciseDrop(ex.id);
            }}
            className={`rounded-xl border border-mdc-blue/15 bg-mdc-blue/5 p-3 transition ${dragShell}`}
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <button
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", ex.id);
                  setDragExerciseId(ex.id);
                }}
                onDragEnd={() => {
                  setDragExerciseId(null);
                  setDragOverExerciseId(null);
                }}
                className="touch-manipulation mt-0.5 flex h-8 w-6 shrink-0 cursor-grab items-center justify-center text-white/30 active:cursor-grabbing active:text-white/50"
                aria-label={`Drag to reorder ${ex.name}`}
              >
                <span className="text-sm leading-none tracking-tighter">⋮⋮</span>
              </button>
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <input
                  type="checkbox"
                  checked={log.done}
                  onChange={() => handleToggleExercise(ex.id)}
                  className="mt-1 h-5 w-5 shrink-0 rounded border-white/30 accent-mdc-blue"
                />
                <div className="min-w-0 flex-1">
                  <span className={`block text-base font-semibold leading-snug sm:text-sm ${log.done ? "text-white/40 line-through" : "text-white"}`}>
                    {ex.name}
                  </span>
                  <span className={`mt-0.5 block text-sm sm:text-xs ${log.done ? "text-white/30" : "text-white/50"}`}>
                    {ex.setsReps}
                  </span>
                  <ExerciseSetInputs
                    iso={iso}
                    exerciseId={ex.id}
                    log={log}
                    onSetsChange={handleSetsChange}
                  />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  ) : null;

  if (workout.type === "rest" || !routine) {
    if (embedded) {
      return (
        <div className="text-white/70">
          <p className="text-base font-bold text-white">{workout.label}</p>
          <p className="mt-0.5 text-sm">{workout.focus}</p>
          <DailyBodyMetricsPanel iso={iso} embedded />
          <p className="mt-2 text-xs text-white/45">Recovery day</p>
        </div>
      );
    }
    return (
      <div className={`mt-4 rounded-xl border p-3 sm:p-3 ${DAY_VIEW_REST}`}>
        <h4 className="text-xs font-semibold uppercase tracking-widest opacity-70">Workout — PPL UL</h4>
        <p className="mt-1 text-base font-bold sm:text-lg">{workout.label}</p>
        <p className="mt-0.5 text-sm opacity-80">{workout.focus}</p>
        <DailyBodyMetricsPanel iso={iso} />
        <p className="mt-3 text-xs opacity-60">Recovery day</p>
      </div>
    );
  }

  if (embedded) {
    return (
      <div className="text-blue-100">
        <p className="text-base font-bold">{workout.label}</p>
        <p className="mt-0.5 text-sm opacity-80">{routine.title}</p>
        <p className="mt-1 text-xs opacity-60">
          {checklistDone}/{checklistTotal} items
          {workoutDone && " · Complete"}
        </p>
        <DailyBodyMetricsPanel iso={iso} embedded />
        <div className="mt-2">{exerciseList}</div>
      </div>
    );
  }

  return (
    <div className={`mt-4 rounded-xl border ${DAY_VIEW_WORKOUT}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="touch-manipulation flex min-h-[52px] w-full items-start justify-between gap-3 p-3 text-left transition active:bg-mdc-blue/10 sm:min-h-0 sm:hover:bg-mdc-blue/5"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-semibold uppercase tracking-widest opacity-70">Workout — PPL UL</h4>
          <p className="mt-1 text-base font-bold sm:text-lg">{workout.label}</p>
          <p className="mt-0.5 text-sm opacity-80">{routine.title}</p>
          <p className="mt-1 text-xs opacity-60">
            {checklistDone}/{checklistTotal} items
            {workoutDone && " · Complete"}
          </p>
        </div>
        <span className="shrink-0 pt-2 text-lg opacity-50 sm:pt-1 sm:text-sm">{open ? "▲" : "▼"}</span>
      </button>

      <DailyBodyMetricsPanel iso={iso} />

      {open && <div className="border-t border-mdc-blue/20 p-3 pt-2">{exerciseList}</div>}
    </div>
  );
}
