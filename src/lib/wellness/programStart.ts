/** Health program begins Jul 5, 2026 — days before are blank on the calendar. */

export const PROGRAM_START = "2026-07-05";

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isProgramDay(dateIso: string): boolean {
  return dateIso >= PROGRAM_START;
}

export function daysSinceProgramStart(dateIso: string): number {
  const start = parseIso(PROGRAM_START);
  const date = parseIso(dateIso);
  return Math.round((date.getTime() - start.getTime()) / 86_400_000);
}
