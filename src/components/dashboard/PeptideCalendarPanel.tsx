"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GHK_START,
  MELANOTAN_START,
  SYRINGE_REFERENCE,
  dayDoseSummary,
  generateDosesForDate,
  type ScheduledDose,
} from "@/lib/wellness/peptideSchedule";
import { getPeptideCompleted, getMealCompleted, getWorkoutCompleted, togglePeptideCompleted, toggleMealCompleted, toggleWorkoutCompleted } from "@/lib/wellness/completionStore";
import {
  DAILY_INGREDIENTS,
  DAILY_MACROS,
  mealsForDate,
  type ScheduledMeal,
} from "@/lib/wellness/mealPlan";
import { custodyLabel, custodyShortLabel, isCustodyDay } from "@/lib/wellness/custodySchedule";
import {
  addDayTodo,
  dayHasJournalActivity,
  dayJournalOpenTodos,
  getDayJournal,
  kickDayTodo,
  removeDayTodo,
  saveDayNote,
  toggleDayTodo,
  type DayJournal,
} from "@/lib/wellness/dayJournalStore";
import {
  WORKOUT_CELL_TEXT,
  workoutForDate,
  type WorkoutDay,
} from "@/lib/wellness/workoutSchedule";
import { isProgramDay, PROGRAM_START } from "@/lib/wellness/programStart";
import WorkoutRoutineSection from "@/components/dashboard/WorkoutRoutineSection";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const WEEKDAYS_SHORT = ["M", "T", "W", "T", "F", "S", "S"] as const;

function formatIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dayLabel(iso: string): string {
  return parseIso(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function isToday(iso: string): boolean {
  return iso === formatIso(new Date());
}

function monthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const startPad = (first.getDay() + 6) % 7;
  const cells: (string | null)[] = Array.from({ length: startPad }, () => null);
  for (let d = 1; d <= lastDay; d++) {
    cells.push(formatIso(new Date(year, month, d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function DayDetailModal({
  iso,
  doses,
  meals,
  workout,
  workoutDone,
  peptideCompleted,
  mealCompleted,
  onTogglePeptide,
  onToggleMeal,
  onToggleWorkout,
  onJournalUpdate,
  onClose,
}: {
  iso: string;
  doses: ScheduledDose[];
  meals: ScheduledMeal[];
  workout: WorkoutDay | null;
  workoutDone: boolean;
  peptideCompleted: Set<string>;
  mealCompleted: Set<string>;
  onTogglePeptide: (id: string) => void;
  onToggleMeal: (id: string) => void;
  onToggleWorkout: (dateIso: string) => void;
  onJournalUpdate: () => void;
  onClose: () => void;
}) {
  const [journal, setJournal] = useState<DayJournal>(() => getDayJournal(iso));
  const [todoDraft, setTodoDraft] = useState("");
  const custody = custodyLabel(iso);
  const programDay = isProgramDay(iso);
  const dosesDone = doses.filter((d) => peptideCompleted.has(d.id)).length;
  const mealsDone = meals.filter((m) => mealCompleted.has(m.id)).length;
  const todosDone = journal.todos.filter((t) => t.done).length;
  const openTodos = journal.todos.length - todosDone;

  useEffect(() => {
    setJournal(getDayJournal(iso));
    setTodoDraft("");
  }, [iso]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function updateJournal(next: DayJournal) {
    setJournal(next);
    onJournalUpdate();
  }

  function handleNoteChange(note: string) {
    setJournal((j) => ({ ...j, note }));
  }

  function handleNoteBlur() {
    updateJournal(saveDayNote(iso, journal.note));
  }

  function handleAddTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!todoDraft.trim()) return;
    updateJournal(addDayTodo(iso, todoDraft));
    setTodoDraft("");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-navy shadow-2xl sm:max-h-[90vh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="day-detail-title"
      >
        <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 border-b border-white/10 bg-navy px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:py-4">
          <div className="min-w-0 flex-1">
            <h3 id="day-detail-title" className="text-base font-semibold leading-snug text-white sm:text-lg">
              {dayLabel(iso)}
            </h3>
            {programDay && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {doses.length > 0 && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60 sm:text-xs">
                    {dosesDone}/{doses.length} doses
                  </span>
                )}
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60 sm:text-xs">
                  {mealsDone}/{meals.length} meals
                </span>
                {workout && workout.type !== "rest" && (
                  <span className="rounded-full bg-mdc-blue/20 px-2 py-0.5 text-[10px] text-blue-200 sm:text-xs">
                    {workoutDone ? "Workout ✓" : workout.label}
                  </span>
                )}
                {journal.todos.length > 0 && (
                  <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] text-violet-200 sm:text-xs">
                    {openTodos === 0 ? "Todos done" : `${openTodos} todo${openTodos === 1 ? "" : "s"}`}
                  </span>
                )}
              </div>
            )}
            {!programDay && (
              <p className="mt-1 text-xs text-white/50">Before program start</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-manipulation shrink-0 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/70 hover:border-white/40 active:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
        {!programDay ? (
          <p className="mt-6 text-sm text-white/40">Plan starts {dayLabel(PROGRAM_START)}.</p>
        ) : (
          <>
        {custody && (
          <div className="mt-4 rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-2.5 text-sm text-sky-100">
            {custody}
          </div>
        )}

        {workout && (
          <WorkoutRoutineSection
            iso={iso}
            workout={workout}
            workoutDone={workoutDone}
            onToggleWorkout={onToggleWorkout}
          />
        )}

        <div className="mt-4 sm:mt-5">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-white/45">Notes</h4>
          <textarea
            value={journal.note}
            onChange={(e) => handleNoteChange(e.target.value)}
            onBlur={handleNoteBlur}
            placeholder="Add notes for this day…"
            rows={3}
            className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-base text-white placeholder:text-white/30 outline-none focus:border-mdc-blue/50 focus:ring-1 focus:ring-mdc-blue/30 sm:py-2.5 sm:text-sm"
          />
        </div>

        <div className="mt-4 sm:mt-5">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-white/45">To-do</h4>
          <form onSubmit={handleAddTodo} className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={todoDraft}
              onChange={(e) => setTodoDraft(e.target.value)}
              placeholder="Add a task…"
              className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-base text-white placeholder:text-white/30 outline-none focus:border-mdc-blue/50 sm:text-sm"
            />
            <button
              type="submit"
              disabled={!todoDraft.trim()}
              className="touch-manipulation min-h-[44px] shrink-0 rounded-xl bg-mdc-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-white hover:text-navy active:opacity-90 disabled:opacity-40 sm:py-2"
            >
              Add
            </button>
          </form>
          {journal.todos.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {journal.todos.map((todo) => (
                <li
                  key={todo.id}
                  className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 p-3 sm:flex-row sm:items-start sm:gap-2 sm:p-2.5"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={() => updateJournal(toggleDayTodo(iso, todo.id))}
                      className="mt-0.5 h-5 w-5 shrink-0 rounded border-white/30 accent-violet-500"
                    />
                    <span className={`min-w-0 flex-1 text-base leading-snug sm:text-sm ${todo.done ? "text-white/35 line-through" : "text-white/80"}`}>
                      {todo.text}
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-2 pl-8 sm:pl-0">
                    <button
                      type="button"
                      onClick={() => updateJournal(kickDayTodo(iso, todo.id))}
                      className="touch-manipulation min-h-[36px] flex-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/60 active:bg-white/10 sm:flex-none sm:px-2 sm:py-0.5 sm:text-[10px] sm:uppercase sm:tracking-wide"
                      title="Add to tomorrow's to-do list"
                    >
                      Kick
                    </button>
                    <button
                      type="button"
                      onClick={() => updateJournal(removeDayTodo(iso, todo.id))}
                      className="touch-manipulation flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-white/15 text-sm text-white/50 active:bg-white/10 hover:text-red-300 sm:min-w-0 sm:border-0"
                      aria-label="Remove task"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-white/35">No tasks yet.</p>
          )}
        </div>

        {doses.length > 0 && (
          <div className="mt-5">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/45">Peptides</h4>
            <ul className="mt-2 space-y-2">
              {doses.map((dose) => {
                const done = peptideCompleted.has(dose.id);
                return (
                  <li key={dose.id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-3 transition active:bg-white/5 sm:hover:border-white/20">
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => onTogglePeptide(dose.id)}
                        className="mt-1 h-5 w-5 shrink-0 rounded border-white/30 accent-emerald-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-2">
                          <span className={`font-semibold ${done ? "text-white/40 line-through" : "text-white"}`}>
                            {dose.compound}
                          </span>
                          <span className={`text-sm tabular-nums ${done ? "text-white/30" : "text-emerald-300"}`}>
                            {dose.doseLabel}
                          </span>
                          {dose.syringeUnits != null && (
                            <span className="text-xs tabular-nums text-mdc-blue">
                              → {dose.syringeUnits} units
                            </span>
                          )}
                        </div>
                        {dose.phase && <p className="mt-0.5 text-xs text-white/45">{dose.phase}</p>}
                        {dose.notes && <p className="mt-0.5 text-xs text-white/40">{dose.notes}</p>}
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="mt-5">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-white/45">Meal plan</h4>
          <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/50">
            <p className="font-semibold text-white/70">Daily totals</p>
            <ul className="mt-1.5 space-y-0.5">
              {DAILY_INGREDIENTS.map((ing) => (
                <li key={ing.item}>
                  {ing.item}: <span className="text-white/70">{ing.amount}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-white/40">
              {DAILY_MACROS.calories} cal · {DAILY_MACROS.protein} protein · {DAILY_MACROS.carbs} carbs ·{" "}
              {DAILY_MACROS.fat} fat
            </p>
          </div>
          <ul className="mt-2 space-y-2">
            {meals.map((meal) => {
              const done = mealCompleted.has(meal.id);
              return (
                <li key={meal.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-3 transition active:bg-white/5 sm:hover:border-white/20">
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => onToggleMeal(meal.id)}
                      className="mt-1 h-5 w-5 shrink-0 rounded border-white/30 accent-amber-500"
                    />
                    <div className="min-w-0 flex-1">
                      <span className={`font-semibold ${done ? "text-white/40 line-through" : "text-white"}`}>
                        {meal.label}
                      </span>
                      <ul className={`mt-1 space-y-0.5 text-sm ${done ? "text-white/30 line-through" : "text-white/60"}`}>
                        {meal.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}

export default function PeptideCalendarPanel() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [refOpen, setRefOpen] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(() => getPeptideCompleted());
  const [mealsCompleted, setMealsCompleted] = useState<Set<string>>(() => getMealCompleted());
  const [workoutsCompleted, setWorkoutsCompleted] = useState<Set<string>>(() => getWorkoutCompleted());
  const [journalTick, setJournalTick] = useState(0);

  const bumpJournal = useCallback(() => setJournalTick((t) => t + 1), []);

  const cells = useMemo(() => monthGrid(year, month), [year, month]);

  const dosesByDay = useMemo(() => {
    const map = new Map<string, ScheduledDose[]>();
    for (const iso of cells) {
      if (iso) map.set(iso, generateDosesForDate(iso));
    }
    if (selectedDate && !map.has(selectedDate)) {
      map.set(selectedDate, generateDosesForDate(selectedDate));
    }
    return map;
  }, [cells, selectedDate]);

  const journalsByDay = useMemo(() => {
    const map = new Map<string, DayJournal>();
    for (const iso of cells) {
      if (iso) map.set(iso, getDayJournal(iso));
    }
    if (selectedDate && !map.has(selectedDate)) {
      map.set(selectedDate, getDayJournal(selectedDate));
    }
    return map;
  }, [cells, selectedDate, journalTick]);

  const toggle = useCallback((id: string) => {
    setCompleted(togglePeptideCompleted(id));
  }, []);

  const toggleMeal = useCallback((id: string) => {
    setMealsCompleted(toggleMealCompleted(id));
  }, []);

  const toggleWorkout = useCallback((dateIso: string) => {
    setWorkoutsCompleted(toggleWorkoutCompleted(dateIso));
  }, []);

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function prevMonth() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function goToToday() {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelectedDate(formatIso(now));
  }

  const selectedDoses = selectedDate ? (dosesByDay.get(selectedDate) ?? []) : [];
  const selectedMeals = selectedDate ? mealsForDate(selectedDate) : [];
  const selectedWorkout = selectedDate ? workoutForDate(selectedDate) : null;

  return (
    <div className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
      <p className="text-xs leading-relaxed text-white/55 sm:max-w-3xl sm:text-sm">
        Plan starts {dayLabel(PROGRAM_START)} (today). PPL UL begins with <strong className="text-white/80">Push</strong>.
        <strong className="text-white/80"> Test + Reta</strong> today · <strong className="text-white/80">Melanotan II</strong>{" "}
        {dayLabel(MELANOTAN_START)} · <strong className="text-white/80">GHK-Cu</strong> {dayLabel(GHK_START)}.
        David & Charles every other week from Mon Jul 6.
      </p>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex sm:flex-wrap sm:justify-between sm:gap-3">
        <button
          type="button"
          onClick={prevMonth}
          className="touch-manipulation min-h-[44px] rounded-full border border-white/20 px-3 py-2 text-xs font-semibold text-white/70 active:bg-white/10 sm:px-4 sm:py-1.5"
        >
          ← Prev
        </button>
        <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-3">
          <p className="text-sm font-semibold text-white sm:text-base">{monthLabel}</p>
          <button
            type="button"
            onClick={goToToday}
            className="touch-manipulation min-h-[32px] rounded-full border border-mdc-blue/40 bg-mdc-blue/10 px-3 py-1 text-xs font-semibold text-mdc-blue active:bg-mdc-blue/20"
          >
            Today
          </button>
        </div>
        <button
          type="button"
          onClick={nextMonth}
          className="touch-manipulation min-h-[44px] justify-self-end rounded-full border border-white/20 px-3 py-2 text-xs font-semibold text-white/70 active:bg-white/10 sm:px-4 sm:py-1.5"
        >
          Next →
        </button>
      </div>

      <div className="-mx-1 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] sm:mx-0 sm:rounded-2xl">
        <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.03]">
          {WEEKDAYS.map((wd, i) => (
            <div
              key={wd}
              className="px-0.5 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-white/40 sm:px-1 sm:py-2 sm:text-xs"
            >
              <span className="sm:hidden">{WEEKDAYS_SHORT[i]}</span>
              <span className="hidden sm:inline">{wd}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((iso, i) => {
            if (!iso) {
              return (
                <div
                  key={`pad-${i}`}
                  className="min-h-[52px] border-b border-r border-white/5 bg-black/10 sm:min-h-[88px]"
                />
              );
            }

            const doses = dosesByDay.get(iso) ?? [];
            const summary = dayDoseSummary(doses);
            const dayMeals = mealsForDate(iso);
            const workout = workoutForDate(iso);
            const workoutDone = workoutsCompleted.has(iso);
            const journal = journalsByDay.get(iso) ?? { note: "", todos: [] };
            const programDay = isProgramDay(iso);
            const todayCell = isToday(iso);
            const kidsWeek = isCustodyDay(iso);
            const hasJournal = dayHasJournalActivity(journal);
            const openTodos = dayJournalOpenTodos(journal);
            const doneCount = doses.filter((d) => completed.has(d.id)).length;
            const mealsDone = dayMeals.filter((m) => mealsCompleted.has(m.id)).length;
            const allDosesDone = doses.length === 0 || doneCount === doses.length;
            const allMealsDone = dayMeals.length === 0 || mealsDone === dayMeals.length;
            const workoutComplete = !workout || workout.type === "rest" || workoutDone;
            const allDone = programDay && allDosesDone && allMealsDone && workoutComplete;
            const partial =
              programDay &&
              ((doneCount > 0 && doneCount < doses.length) ||
                (mealsDone > 0 && mealsDone < dayMeals.length) ||
                (workout != null && workout.type !== "rest" && workoutDone));

            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelectedDate(iso)}
                className={`group touch-manipulation min-h-[52px] border-b border-r border-white/10 p-1 text-left transition active:bg-white/10 sm:min-h-[96px] sm:p-2 ${
                  !programDay
                    ? "bg-black/10 opacity-40"
                    : "hover:bg-white/[0.06]"
                } ${todayCell ? "bg-mdc-blue/10 ring-1 ring-inset ring-mdc-blue/40 !opacity-100" : ""} ${
                  kidsWeek ? "bg-sky-500/[0.07]" : ""
                } ${allDone ? "bg-emerald-500/5" : ""}`}
              >
                <div className="flex items-center justify-between gap-0.5">
                  <span
                    className={`text-[11px] font-bold tabular-nums sm:text-sm ${
                      todayCell ? "text-mdc-blue" : programDay ? "text-white/80" : "text-white/40"
                    }`}
                  >
                    {parseIso(iso).getDate()}
                  </span>
                  {programDay && (
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        allDone ? "bg-emerald-400" : partial ? "bg-amber-400" : "bg-white/25"
                      }`}
                    />
                  )}
                </div>
                {programDay && workout && (
                  <p
                    className={`mt-0.5 line-clamp-2 text-[8px] font-semibold leading-tight sm:mt-1 sm:line-clamp-1 sm:text-[10px] ${WORKOUT_CELL_TEXT[workout.type]} ${workoutDone && workout.type !== "rest" ? "line-through opacity-50" : ""}`}
                  >
                    {workout.label}
                  </p>
                )}
                {programDay && summary && (
                  <p className="mt-0.5 hidden line-clamp-1 text-[9px] leading-tight text-white/55 sm:block sm:text-[10px]">
                    {summary}
                  </p>
                )}
                {programDay && kidsWeek && (
                  <p className="mt-0.5 hidden line-clamp-1 text-[9px] font-medium text-sky-300/90 sm:block sm:text-[10px]">
                    {custodyShortLabel(iso)}
                  </p>
                )}
                {programDay && dayMeals.length > 0 && (
                  <p className="mt-0.5 hidden text-[9px] text-amber-200/70 sm:block sm:text-[10px]">
                    {mealsDone}/{dayMeals.length} meals
                  </p>
                )}
                {programDay && hasJournal && (
                  <p className="mt-0.5 hidden text-[9px] text-violet-300/80 sm:block sm:text-[10px]">
                    {openTodos > 0 ? `${openTodos} todo${openTodos === 1 ? "" : "s"}` : "Note"}
                  </p>
                )}
                {doses.length > 0 && (
                  <p className="mt-0.5 hidden text-[9px] tabular-nums text-white/35 lg:block">
                    {doneCount}/{doses.length} doses
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-white/40">
        Click any day to view workout, peptides, meals, notes, and todos.
      </p>

      <div>
        <button
          type="button"
          onClick={() => setRefOpen((o) => !o)}
          className="touch-manipulation flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-xs font-semibold text-white/60 active:bg-white/5 sm:py-2.5 sm:hover:border-white/20 sm:hover:text-white/80"
          aria-expanded={refOpen}
        >
          <span>Syringe reference (1.0 mL)</span>
          <span className="text-white/40">{refOpen ? "▲" : "▼"}</span>
        </button>
        {refOpen && (
          <div className="mt-2 grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:grid-cols-3">
            {SYRINGE_REFERENCE.map((ref) => (
              <div key={ref.compound} className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs">
                <p className="font-semibold text-white/80">{ref.compound}</p>
                <ul className="mt-2 space-y-1 text-white/55">
                  {ref.rows.map((r) => (
                    <li key={r.dose} className="flex justify-between tabular-nums">
                      <span>{r.dose}</span>
                      <span className="text-mdc-blue">{r.units} units</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedDate && (
        <DayDetailModal
          iso={selectedDate}
          doses={selectedDoses}
          meals={selectedMeals}
          workout={selectedWorkout}
          workoutDone={workoutsCompleted.has(selectedDate)}
          peptideCompleted={completed}
          mealCompleted={mealsCompleted}
          onTogglePeptide={toggle}
          onToggleMeal={toggleMeal}
          onToggleWorkout={toggleWorkout}
          onJournalUpdate={bumpJournal}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
