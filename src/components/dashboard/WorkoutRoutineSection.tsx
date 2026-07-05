"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getDailyBodyWeight,
  getExerciseLogsForDay,
  saveDailyBodyWeight,
  saveExerciseLog,
  toggleExerciseDone,
  type ExerciseLog,
} from "@/lib/wellness/workoutLogStore";
import { WORKOUT_ROUTINES } from "@/lib/wellness/workoutRoutines";
import type { WorkoutDay } from "@/lib/wellness/workoutSchedule";

const DAY_VIEW_WORKOUT =
  "border-mdc-blue/35 bg-mdc-blue/10 text-blue-100 shadow-sm shadow-mdc-blue/5";
const DAY_VIEW_REST = "border-white/15 bg-white/5 text-white/50";

const INPUT_CLASS =
  "min-h-[44px] w-full rounded-lg border border-mdc-blue/20 bg-mdc-blue/5 px-3 py-2.5 text-base text-white placeholder:text-white/30 outline-none focus:border-mdc-blue/50 focus:ring-1 focus:ring-mdc-blue/20 sm:min-h-0 sm:px-2.5 sm:py-1.5 sm:text-xs";

function DailyWeightField({ iso }: { iso: string }) {
  const [bodyWeight, setBodyWeight] = useState("");

  useEffect(() => {
    setBodyWeight(getDailyBodyWeight(iso));
  }, [iso]);

  return (
    <div className="border-t border-mdc-blue/20 px-3 py-3 sm:py-2.5">
      <label className="block text-[10px] font-semibold uppercase tracking-widest text-blue-200/70">
        Body weight today
      </label>
      <div className="mt-2 flex items-center gap-2 sm:mt-1.5">
        <input
          type="text"
          inputMode="decimal"
          value={bodyWeight}
          onChange={(e) => setBodyWeight(e.target.value)}
          onBlur={() => saveDailyBodyWeight(iso, bodyWeight.trim())}
          placeholder="e.g. 185"
          className={INPUT_CLASS}
        />
        <span className="shrink-0 text-sm text-blue-200/50 sm:text-xs">lb</span>
      </div>
    </div>
  );
}

interface WorkoutRoutineSectionProps {
  iso: string;
  workout: WorkoutDay;
  workoutDone: boolean;
  onToggleWorkout: (dateIso: string) => void;
}

export default function WorkoutRoutineSection({
  iso,
  workout,
  workoutDone,
  onToggleWorkout,
}: WorkoutRoutineSectionProps) {
  const [open, setOpen] = useState(false);
  const routine = workout.routineId ? WORKOUT_ROUTINES[workout.routineId] : null;
  const exerciseIds = useMemo(() => routine?.exercises.map((e) => e.id) ?? [], [routine]);

  const [logs, setLogs] = useState<Record<string, ExerciseLog>>({});

  const reloadLogs = useCallback(() => {
    if (!exerciseIds.length) {
      setLogs({});
      return;
    }
    setLogs(getExerciseLogsForDay(iso, exerciseIds));
  }, [iso, exerciseIds]);

  useEffect(() => {
    reloadLogs();
    setOpen(false);
  }, [iso, reloadLogs]);

  const doneCount = exerciseIds.filter((id) => logs[id]?.done).length;
  const total = exerciseIds.length;

  function syncWorkoutDone(nextLogs: Record<string, ExerciseLog>) {
    if (!exerciseIds.length) return;
    const allDone = exerciseIds.every((id) => nextLogs[id]?.done);
    if (allDone && !workoutDone) onToggleWorkout(iso);
    else if (!allDone && workoutDone) onToggleWorkout(iso);
  }

  function handleToggleExercise(exerciseId: string) {
    toggleExerciseDone(iso, exerciseId);
    const next = getExerciseLogsForDay(iso, exerciseIds);
    setLogs(next);
    syncWorkoutDone(next);
  }

  function handleWeightChange(exerciseId: string, weightNote: string) {
    setLogs((prev) => ({
      ...prev,
      [exerciseId]: { ...(prev[exerciseId] ?? { done: false, weightNote: "" }), weightNote },
    }));
  }

  function handleWeightBlur(exerciseId: string) {
    const note = logs[exerciseId]?.weightNote ?? "";
    saveExerciseLog(iso, exerciseId, { weightNote: note });
  }

  if (workout.type === "rest" || !routine) {
    return (
      <div className={`mt-4 rounded-xl border p-3 sm:p-3 ${DAY_VIEW_REST}`}>
        <h4 className="text-xs font-semibold uppercase tracking-widest opacity-70">Workout — PPL UL</h4>
        <p className="mt-1 text-base font-bold sm:text-lg">{workout.label}</p>
        <p className="mt-0.5 text-sm opacity-80">{workout.focus}</p>
        <DailyWeightField iso={iso} />
        <p className="mt-3 text-xs opacity-60">Recovery day</p>
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
            {doneCount}/{total} exercises
            {workoutDone && " · Complete"}
          </p>
        </div>
        <span className="shrink-0 pt-2 text-lg opacity-50 sm:pt-1 sm:text-sm">{open ? "▲" : "▼"}</span>
      </button>

      <DailyWeightField iso={iso} />

      {open && (
        <ul className="space-y-2 border-t border-mdc-blue/20 p-3 pt-2">
          {routine.exercises.map((ex) => {
            const log = logs[ex.id] ?? { done: false, weightNote: "" };
            return (
              <li key={ex.id} className="rounded-xl border border-mdc-blue/15 bg-mdc-blue/5 p-3">
                <label className="flex cursor-pointer items-start gap-3">
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
                    <input
                      type="text"
                      value={log.weightNote}
                      onChange={(e) => handleWeightChange(ex.id, e.target.value)}
                      onBlur={() => handleWeightBlur(ex.id)}
                      placeholder="Weight / notes (e.g. 185 lb × 8)"
                      className={`mt-2 ${INPUT_CLASS}`}
                    />
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
