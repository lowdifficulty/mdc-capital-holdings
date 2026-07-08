import "server-only";

import type { DayJournal } from "@/lib/wellness/dayJournalStore";
import { custodyLabel, isCustodyDay } from "@/lib/wellness/custodySchedule";
import { mealsForDate } from "@/lib/wellness/mealPlan";
import { generateDosesForDate } from "@/lib/wellness/peptideSchedule";
import type { WellnessData } from "@/lib/wellness/types";
import { workoutForDate } from "@/lib/wellness/workoutSchedule";
import { DAILY_CARDIO_LABEL } from "@/lib/wellness/completionStore";

function emptyJournal(): DayJournal {
  return { note: "", noteLocked: false, planNotes: {}, todos: [], custodyTodos: [] };
}

export interface DailyBrief {
  date: string;
  custody: { active: boolean; label: string | null; pickedUp: boolean };
  workout: {
    scheduled: boolean;
    label: string | null;
    focus: string | null;
    completed: boolean;
  };
  cardio: { scheduled: boolean; label: string; completed: boolean };
  peptides: {
    scheduled: Array<{ id: string; compound: string; doseLabel: string; done: boolean }>;
    pendingCount: number;
  };
  meals: {
    scheduled: Array<{ id: string; label: string; items: string[]; done: boolean }>;
    pendingCount: number;
  };
  todos: Array<{ id: string; text: string; done: boolean; list: "day" | "custody" }>;
  openTodoCount: number;
  notes: {
    dayNote: string;
    planNotes: Record<string, string>;
  };
  bodyMetrics: {
    logged: boolean;
    weight: string | null;
  };
}

export function buildDailyBrief(data: WellnessData, dateIso: string): DailyBrief {
  const journal = data.dayJournals[dateIso] ?? emptyJournal();
  const doses = generateDosesForDate(dateIso);
  const meals = mealsForDate(dateIso);
  const workout = workoutForDate(dateIso);
  const metrics = data.dailyBodyMetrics[dateIso];

  const peptideItems = doses.map((d) => ({
    id: d.id,
    compound: d.compound,
    doseLabel: d.doseLabel,
    done: data.peptideCheckoffs.includes(d.id),
  }));

  const mealItems = meals.map((m) => ({
    id: m.id,
    label: m.label,
    items: m.items,
    done: data.mealCheckoffs.includes(m.id),
  }));

  const todos = [
    ...journal.todos.map((t) => ({ ...t, list: "day" as const })),
    ...journal.custodyTodos.map((t) => ({ ...t, list: "custody" as const })),
  ];

  const planNotes: Record<string, string> = {};
  for (const [key, value] of Object.entries(journal.planNotes ?? {})) {
    if (value?.trim()) planNotes[key] = value.trim();
  }

  return {
    date: dateIso,
    custody: {
      active: isCustodyDay(dateIso),
      label: custodyLabel(dateIso),
      pickedUp: (data.custodyPickupCheckoffs ?? []).includes(dateIso),
    },
    workout: {
      scheduled: Boolean(workout),
      label: workout?.label ?? null,
      focus: workout?.focus ?? null,
      completed: data.workoutCheckoffs.includes(dateIso),
    },
    cardio: {
      scheduled: Boolean(workout),
      label: DAILY_CARDIO_LABEL,
      completed: data.cardioCheckoffs.includes(dateIso),
    },
    peptides: {
      scheduled: peptideItems,
      pendingCount: peptideItems.filter((p) => !p.done).length,
    },
    meals: {
      scheduled: mealItems,
      pendingCount: mealItems.filter((m) => !m.done).length,
    },
    todos,
    openTodoCount: todos.filter((t) => !t.done).length,
    notes: {
      dayNote: journal.note?.trim() ?? "",
      planNotes,
    },
    bodyMetrics: {
      logged: Boolean(metrics?.locked),
      weight: metrics?.weight?.trim() || null,
    },
  };
}
