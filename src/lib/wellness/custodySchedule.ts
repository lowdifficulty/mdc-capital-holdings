/** David & Charles — every other week starting Monday Jul 6, 2026. */

export const CUSTODY_ANCHOR = "2026-07-06";
export const CUSTODY_CHILDREN = ["David", "Charles"] as const;

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(startIso: string, endIso: string): number {
  const a = parseDate(startIso);
  const b = parseDate(endIso);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

import { isProgramDay } from "@/lib/wellness/programStart";

/** True on custody weeks (Mon–Sun blocks alternating from anchor week). */
export function isCustodyDay(dateIso: string): boolean {
  if (!isProgramDay(dateIso)) return false;
  const days = daysBetween(CUSTODY_ANCHOR, dateIso);
  if (days < 0) return false;
  const weekIndex = Math.floor(days / 7);
  return weekIndex % 2 === 0;
}

export function custodyLabel(dateIso: string): string | null {
  if (!isCustodyDay(dateIso)) return null;
  return `${CUSTODY_CHILDREN.join(" & ")} — custody week`;
}

export function custodyShortLabel(dateIso: string): string | null {
  if (!isCustodyDay(dateIso)) return null;
  return "Kids week";
}
