import "server-only";

import { randomUUID } from "crypto";
import type { DayJournal } from "@/lib/wellness/dayJournalStore";
import { mealsForDate } from "@/lib/wellness/mealPlan";
import { generateDosesForDate } from "@/lib/wellness/peptideSchedule";
import { getWellnessForUser, saveWellnessForUser } from "@/lib/wellness/serverStore";
import type { WellnessData } from "@/lib/wellness/types";
import { buildDailyBrief } from "@/lib/voice/operations-brief";
import { dashboardTodayIso, resolveDateIso } from "@/lib/voice/dates";

function emptyJournal(): DayJournal {
  return { note: "", noteLocked: false, planNotes: {}, todos: [], custodyTodos: [] };
}

function ensureJournal(data: WellnessData, dateIso: string): WellnessData {
  if (data.dayJournals[dateIso]) return data;
  return {
    ...data,
    dayJournals: { ...data.dayJournals, [dateIso]: emptyJournal() },
  };
}

function touch(data: WellnessData): WellnessData {
  return { ...data, updatedAt: new Date().toISOString() };
}

function findPeptideId(dateIso: string, query: string): string | null {
  const q = query.trim().toLowerCase();
  const doses = generateDosesForDate(dateIso);
  const exact = doses.find((d) => d.id === query || d.id.endsWith(`-${q}`));
  if (exact) return exact.id;
  const byCompound = doses.find((d) => d.compound.toLowerCase().includes(q));
  return byCompound?.id ?? null;
}

function findMealId(dateIso: string, query: string): string | null {
  const q = query.trim().toLowerCase();
  const meals = mealsForDate(dateIso);
  const exact = meals.find((m) => m.id === query);
  if (exact) return exact.id;
  const byLabel = meals.find((m) => m.label.toLowerCase() === q || m.label.toLowerCase().includes(q));
  return byLabel?.id ?? null;
}

function findTodo(
  journal: DayJournal,
  query: string
): { list: "todos" | "custodyTodos"; id: string } | null {
  const q = query.trim().toLowerCase();
  for (const todo of journal.todos) {
    if (todo.id === query || todo.text.toLowerCase().includes(q)) {
      return { list: "todos", id: todo.id };
    }
  }
  for (const todo of journal.custodyTodos) {
    if (todo.id === query || todo.text.toLowerCase().includes(q)) {
      return { list: "custodyTodos", id: todo.id };
    }
  }
  return null;
}

export async function executeOperationsTool(
  email: string,
  name: string,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const dateIso = resolveDateIso(args.date);
  let data = await getWellnessForUser(email);

  switch (name) {
    case "get_daily_brief": {
      return { brief: buildDailyBrief(data, dateIso), today: dashboardTodayIso() };
    }

    case "add_todo": {
      const text = typeof args.text === "string" ? args.text.trim() : "";
      if (!text) return { error: "text is required" };
      const custody = args.custody === true;
      data = ensureJournal(data, dateIso);
      const journal = { ...data.dayJournals[dateIso] };
      const todo = { id: randomUUID(), text, done: false };
      if (custody) journal.custodyTodos = [todo, ...journal.custodyTodos];
      else journal.todos = [todo, ...journal.todos];
      data = touch({
        ...data,
        dayJournals: { ...data.dayJournals, [dateIso]: journal },
      });
      const saved = await saveWellnessForUser(email, data);
      return {
        success: true,
        todo,
        brief: buildDailyBrief(saved, dateIso),
      };
    }

    case "complete_todo": {
      const query =
        (typeof args.todo_id === "string" && args.todo_id) ||
        (typeof args.text === "string" && args.text) ||
        "";
      if (!query) return { error: "todo_id or text is required" };
      data = ensureJournal(data, dateIso);
      const journal = { ...data.dayJournals[dateIso] };
      const found = findTodo(journal, query);
      if (!found) return { error: `No todo matching "${query}" on ${dateIso}` };
      if (found.list === "todos") {
        journal.todos = journal.todos.map((t) =>
          t.id === found.id ? { ...t, done: true } : t
        );
      } else {
        journal.custodyTodos = journal.custodyTodos.map((t) =>
          t.id === found.id ? { ...t, done: true } : t
        );
      }
      data = touch({
        ...data,
        dayJournals: { ...data.dayJournals, [dateIso]: journal },
      });
      const saved = await saveWellnessForUser(email, data);
      return { success: true, brief: buildDailyBrief(saved, dateIso) };
    }

    case "log_peptide_taken": {
      const query =
        (typeof args.peptide_id === "string" && args.peptide_id) ||
        (typeof args.compound_name === "string" && args.compound_name) ||
        "";
      if (!query) return { error: "peptide_id or compound_name is required" };
      const id = findPeptideId(dateIso, query);
      if (!id) return { error: `No peptide scheduled matching "${query}" on ${dateIso}` };
      const checkoffs = new Set(data.peptideCheckoffs);
      checkoffs.add(id);
      data = touch({ ...data, peptideCheckoffs: [...checkoffs] });
      const saved = await saveWellnessForUser(email, data);
      return { success: true, peptide_id: id, brief: buildDailyBrief(saved, dateIso) };
    }

    case "log_meal_eaten": {
      const query =
        (typeof args.meal_id === "string" && args.meal_id) ||
        (typeof args.meal_label === "string" && args.meal_label) ||
        "";
      if (!query) return { error: "meal_id or meal_label is required" };
      const id = findMealId(dateIso, query);
      if (!id) return { error: `No meal matching "${query}" on ${dateIso}` };
      const checkoffs = new Set(data.mealCheckoffs);
      checkoffs.add(id);
      data = touch({ ...data, mealCheckoffs: [...checkoffs] });
      const saved = await saveWellnessForUser(email, data);
      return { success: true, meal_id: id, brief: buildDailyBrief(saved, dateIso) };
    }

    case "log_workout_complete": {
      const checkoffs = new Set(data.workoutCheckoffs);
      checkoffs.add(dateIso);
      data = touch({ ...data, workoutCheckoffs: [...checkoffs] });
      const saved = await saveWellnessForUser(email, data);
      return { success: true, brief: buildDailyBrief(saved, dateIso) };
    }

    case "log_cardio_complete": {
      const checkoffs = new Set(data.cardioCheckoffs);
      checkoffs.add(dateIso);
      data = touch({ ...data, cardioCheckoffs: [...checkoffs] });
      const saved = await saveWellnessForUser(email, data);
      return { success: true, brief: buildDailyBrief(saved, dateIso) };
    }

    case "update_day_note": {
      const note = typeof args.note === "string" ? args.note.trim() : "";
      if (!note) return { error: "note is required" };
      data = ensureJournal(data, dateIso);
      const journal = { ...data.dayJournals[dateIso], note, noteLocked: true };
      data = touch({
        ...data,
        dayJournals: { ...data.dayJournals, [dateIso]: journal },
      });
      const saved = await saveWellnessForUser(email, data);
      return { success: true, brief: buildDailyBrief(saved, dateIso) };
    }

    case "update_section_note": {
      const section = typeof args.section === "string" ? args.section.trim() : "";
      const text = typeof args.text === "string" ? args.text.trim() : "";
      const allowed = ["custody", "workout", "meal", "todo", "peptides"] as const;
      if (!allowed.includes(section as (typeof allowed)[number])) {
        return { error: "section must be custody, workout, meal, todo, or peptides" };
      }
      if (!text) return { error: "text is required" };
      data = ensureJournal(data, dateIso);
      const journal = { ...data.dayJournals[dateIso] };
      journal.planNotes = { ...journal.planNotes, [section]: text };
      data = touch({
        ...data,
        dayJournals: { ...data.dayJournals, [dateIso]: journal },
      });
      const saved = await saveWellnessForUser(email, data);
      return { success: true, brief: buildDailyBrief(saved, dateIso) };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
