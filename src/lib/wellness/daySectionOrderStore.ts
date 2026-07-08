import { markWellnessDirty } from "@/lib/wellness/syncNotify";

const ORDER_KEY = "mdc-day-section-order";

export type DaySectionId = "custody" | "workout" | "meal" | "todo" | "peptides" | "notes";

export const DEFAULT_DAY_SECTION_ORDER: DaySectionId[] = [
  "custody",
  "workout",
  "meal",
  "todo",
  "peptides",
  "notes",
];

const ALL_IDS = new Set<DaySectionId>(DEFAULT_DAY_SECTION_ORDER);

function normalizeOrder(raw: unknown): DaySectionId[] {
  if (!Array.isArray(raw)) return [...DEFAULT_DAY_SECTION_ORDER];
  const seen = new Set<DaySectionId>();
  const out: DaySectionId[] = [];
  for (const item of raw) {
    if (typeof item !== "string" || !ALL_IDS.has(item as DaySectionId)) continue;
    const id = item as DaySectionId;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  for (const id of DEFAULT_DAY_SECTION_ORDER) {
    if (!seen.has(id)) out.push(id);
  }
  return out;
}

export function getDaySectionOrder(): DaySectionId[] {
  if (typeof window === "undefined") return [...DEFAULT_DAY_SECTION_ORDER];
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (!raw) return [...DEFAULT_DAY_SECTION_ORDER];
    return normalizeOrder(JSON.parse(raw));
  } catch {
    return [...DEFAULT_DAY_SECTION_ORDER];
  }
}

export function saveDaySectionOrder(order: DaySectionId[]): void {
  localStorage.setItem(ORDER_KEY, JSON.stringify(normalizeOrder(order)));
  markWellnessDirty();
}

export function reorderDaySections(
  order: DaySectionId[],
  draggedId: DaySectionId,
  targetId: DaySectionId
): DaySectionId[] {
  if (draggedId === targetId) return order;
  const next = [...order];
  const from = next.indexOf(draggedId);
  const to = next.indexOf(targetId);
  if (from < 0 || to < 0) return order;
  next.splice(from, 1);
  next.splice(to, 0, draggedId);
  return next;
}

export function visibleDaySectionOrder(
  order: DaySectionId[],
  opts: { hasWorkout: boolean; hasPeptides: boolean; hasCustody: boolean }
): DaySectionId[] {
  return order.filter((id) => {
    if (id === "workout") return opts.hasWorkout;
    if (id === "peptides") return opts.hasPeptides;
    if (id === "custody") return opts.hasCustody;
    return true;
  });
}
