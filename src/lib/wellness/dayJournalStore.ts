import { markWellnessDirty, markWellnessSaved } from "@/lib/wellness/syncNotify";

const JOURNAL_KEY = "mdc-day-journals";

export interface DayTodo {
  id: string;
  text: string;
  done: boolean;
}

export type PlanNoteSectionId = "custody" | "workout" | "meal" | "todo" | "peptides";

export interface DaySectionPlanNotes {
  custody?: string;
  workout?: string;
  meal?: string;
  todo?: string;
  peptides?: string;
}

export interface DayJournal {
  note: string;
  /** When true, note is saved and read-only until Edit. */
  noteLocked?: boolean;
  /** @deprecated Migrated to planNotes.custody */
  custodyNote?: string;
  planNotes?: DaySectionPlanNotes;
  todos: DayTodo[];
  custodyTodos: DayTodo[];
}

function emptyJournal(): DayJournal {
  return { note: "", noteLocked: false, planNotes: {}, todos: [], custodyTodos: [] };
}

function normalizeJournal(journal: DayJournal): DayJournal {
  const note = journal.note ?? "";
  const planNotes = { ...journal.planNotes };
  if (journal.custodyNote?.trim() && !planNotes.custody) {
    planNotes.custody = journal.custodyNote;
  }
  return {
    note,
    noteLocked: journal.noteLocked ?? note.trim().length > 0,
    planNotes,
    todos: journal.todos ?? [],
    custodyTodos: journal.custodyTodos ?? [],
  };
}

function readAll(): Record<string, DayJournal> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, DayJournal>;
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, DayJournal>, sync: "debounced" | "immediate" = "debounced"): void {
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(data));
  if (sync === "immediate") markWellnessSaved();
  else markWellnessDirty();
}

function ensure(data: Record<string, DayJournal>, dateIso: string): DayJournal {
  if (!data[dateIso]) data[dateIso] = emptyJournal();
  const journal = data[dateIso];
  if (!journal.todos) journal.todos = [];
  if (!journal.custodyTodos) journal.custodyTodos = [];
  if (!journal.planNotes) journal.planNotes = {};
  return journal;
}

function tomorrowIso(dateIso: string): string {
  const [y, m, d] = dateIso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function reorderTodos(todos: DayTodo[], draggedId: string, targetId: string): DayTodo[] {
  const from = todos.findIndex((t) => t.id === draggedId);
  const to = todos.findIndex((t) => t.id === targetId);
  if (from < 0 || to < 0 || from === to) return [...todos];
  const next = [...todos];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function getAllDayJournals(): Record<string, DayJournal> {
  return readAll();
}

export function getDayJournal(dateIso: string): DayJournal {
  const all = readAll();
  return normalizeJournal(all[dateIso] ?? emptyJournal());
}

export function dayHasJournalActivity(journal: DayJournal): boolean {
  if (journal.note.trim()) return true;
  if (journal.planNotes && Object.values(journal.planNotes).some((n) => n?.trim())) return true;
  return journal.todos.length > 0 || journal.custodyTodos.length > 0;
}

export function dayJournalOpenTodos(journal: DayJournal): number {
  return journal.todos.filter((t) => !t.done).length;
}

export function dayJournalOpenCustodyTodos(journal: DayJournal): number {
  return journal.custodyTodos.filter((t) => !t.done).length;
}

export function saveDayNote(dateIso: string, note: string): DayJournal {
  const all = readAll();
  const journal = normalizeJournal(ensure(all, dateIso));
  journal.note = note;
  journal.noteLocked = true;
  all[dateIso] = journal;
  writeAll(all, "immediate");
  return { ...journal };
}

export function saveDaySectionPlanNote(
  dateIso: string,
  section: PlanNoteSectionId,
  text: string
): DayJournal {
  const all = readAll();
  const journal = normalizeJournal(ensure(all, dateIso));
  if (!journal.planNotes) journal.planNotes = {};
  journal.planNotes[section] = text;
  all[dateIso] = journal;
  writeAll(all, "immediate");
  return { ...journal, planNotes: { ...journal.planNotes } };
}

export function addDayTodo(dateIso: string, text: string): DayJournal {
  const trimmed = text.trim();
  if (!trimmed) return getDayJournal(dateIso);
  const all = readAll();
  const journal = ensure(all, dateIso);
  journal.todos.push({ id: crypto.randomUUID(), text: trimmed, done: false });
  writeAll(all);
  return { ...journal, todos: [...journal.todos] };
}

export function toggleDayTodo(dateIso: string, todoId: string): DayJournal {
  const all = readAll();
  const journal = ensure(all, dateIso);
  const todo = journal.todos.find((t) => t.id === todoId);
  if (todo) todo.done = !todo.done;
  writeAll(all);
  return { ...journal, todos: [...journal.todos] };
}

export function removeDayTodo(dateIso: string, todoId: string): DayJournal {
  const all = readAll();
  const journal = ensure(all, dateIso);
  journal.todos = journal.todos.filter((t) => t.id !== todoId);
  writeAll(all);
  return { ...journal, todos: [...journal.todos] };
}

export function reorderDayTodos(
  dateIso: string,
  draggedId: string,
  targetId: string
): DayJournal {
  const all = readAll();
  const journal = ensure(all, dateIso);
  journal.todos = reorderTodos(journal.todos, draggedId, targetId);
  writeAll(all);
  return { ...journal, todos: [...journal.todos] };
}

/** Move a todo to tomorrow's list (same text, unchecked). */
export function kickDayTodo(dateIso: string, todoId: string): DayJournal {
  const all = readAll();
  const journal = ensure(all, dateIso);
  const todo = journal.todos.find((t) => t.id === todoId);
  if (!todo) return { ...journal, todos: [...journal.todos] };

  const nextDay = tomorrowIso(dateIso);
  const tomorrow = ensure(all, nextDay);
  tomorrow.todos.push({ id: crypto.randomUUID(), text: todo.text, done: false });
  journal.todos = journal.todos.filter((t) => t.id !== todoId);
  writeAll(all);
  return { ...journal, todos: [...journal.todos] };
}

export function addCustodyTodo(dateIso: string, text: string): DayJournal {
  const trimmed = text.trim();
  if (!trimmed) return getDayJournal(dateIso);
  const all = readAll();
  const journal = ensure(all, dateIso);
  journal.custodyTodos.push({ id: crypto.randomUUID(), text: trimmed, done: false });
  writeAll(all);
  return { ...journal, custodyTodos: [...journal.custodyTodos] };
}

export function toggleCustodyTodo(dateIso: string, todoId: string): DayJournal {
  const all = readAll();
  const journal = ensure(all, dateIso);
  const todo = journal.custodyTodos.find((t) => t.id === todoId);
  if (todo) todo.done = !todo.done;
  writeAll(all);
  return { ...journal, custodyTodos: [...journal.custodyTodos] };
}

export function removeCustodyTodo(dateIso: string, todoId: string): DayJournal {
  const all = readAll();
  const journal = ensure(all, dateIso);
  journal.custodyTodos = journal.custodyTodos.filter((t) => t.id !== todoId);
  writeAll(all);
  return { ...journal, custodyTodos: [...journal.custodyTodos] };
}

export function reorderCustodyTodos(
  dateIso: string,
  draggedId: string,
  targetId: string
): DayJournal {
  const all = readAll();
  const journal = ensure(all, dateIso);
  journal.custodyTodos = reorderTodos(journal.custodyTodos, draggedId, targetId);
  writeAll(all);
  return { ...journal, custodyTodos: [...journal.custodyTodos] };
}

/** Move a custody todo to tomorrow's custody list (same text, unchecked). */
export function kickCustodyTodo(dateIso: string, todoId: string): DayJournal {
  const all = readAll();
  const journal = ensure(all, dateIso);
  const todo = journal.custodyTodos.find((t) => t.id === todoId);
  if (!todo) return { ...journal, custodyTodos: [...journal.custodyTodos] };

  const nextDay = tomorrowIso(dateIso);
  const tomorrow = ensure(all, nextDay);
  tomorrow.custodyTodos.push({ id: crypto.randomUUID(), text: todo.text, done: false });
  journal.custodyTodos = journal.custodyTodos.filter((t) => t.id !== todoId);
  writeAll(all);
  return { ...journal, custodyTodos: [...journal.custodyTodos] };
}
