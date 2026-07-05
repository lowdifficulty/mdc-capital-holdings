const JOURNAL_KEY = "mdc-day-journals";

export interface DayTodo {
  id: string;
  text: string;
  done: boolean;
}

export interface DayJournal {
  note: string;
  todos: DayTodo[];
}

function emptyJournal(): DayJournal {
  return { note: "", todos: [] };
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

function writeAll(data: Record<string, DayJournal>): void {
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(data));
}

function ensure(data: Record<string, DayJournal>, dateIso: string): DayJournal {
  if (!data[dateIso]) data[dateIso] = emptyJournal();
  return data[dateIso];
}

function tomorrowIso(dateIso: string): string {
  const [y, m, d] = dateIso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getAllDayJournals(): Record<string, DayJournal> {
  return readAll();
}

export function getDayJournal(dateIso: string): DayJournal {
  const all = readAll();
  return all[dateIso] ?? emptyJournal();
}

export function dayHasJournalActivity(journal: DayJournal): boolean {
  if (journal.note.trim()) return true;
  return journal.todos.length > 0;
}

export function dayJournalOpenTodos(journal: DayJournal): number {
  return journal.todos.filter((t) => !t.done).length;
}

export function saveDayNote(dateIso: string, note: string): DayJournal {
  const all = readAll();
  const journal = ensure(all, dateIso);
  journal.note = note;
  writeAll(all);
  return { ...journal };
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
