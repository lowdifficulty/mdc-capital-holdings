/** Peptide program — Test + Reta Jul 5; MT2 Jul 8; GHK-Cu Jul 14; HGH Jul 5 (titrating). */

import { isProgramDay } from "@/lib/wellness/programStart";

export const TEST_START = "2026-07-05";
export const RETATRUTIDE_START = "2026-07-05";
export const GHK_START = "2026-07-14";
export const MELANOTAN_START = "2026-07-08";
export const HGH_START = "2026-07-05";

/** @deprecated Use TEST_START */
export const TEST_RETATRUTIDE_START = TEST_START;
/** @deprecated Use GHK_START / MELANOTAN_START */
export const SECONDARY_PEPTIDE_START = MELANOTAN_START;

const BAC_ML = 3;

export interface Reconstitution {
  peptide: string;
  totalMg: number;
  bacWaterMl: number;
  mgPerMl: number;
}

export const RECONSTITUTIONS: Reconstitution[] = [
  { peptide: "Retatrutide", totalMg: 10, bacWaterMl: BAC_ML, mgPerMl: 10 / BAC_ML },
  { peptide: "GHK-Cu", totalMg: 100, bacWaterMl: BAC_ML, mgPerMl: 100 / BAC_ML },
  { peptide: "Melanotan II", totalMg: 10, bacWaterMl: BAC_ML, mgPerMl: 10 / BAC_ML },
];

/** Units on a U-100 1.0 mL insulin syringe (10 tick marks = 0.1 mL). */
export function syringeUnits(doseMg: number, mgPerMl: number): number {
  const ml = doseMg / mgPerMl;
  return Math.round(ml * 10 * 10) / 10;
}

export function formatUnits(units: number): string {
  return `${units} units (${(units / 10).toFixed(3)} mL)`;
}

export interface ScheduledDose {
  id: string;
  date: string;
  compound: string;
  doseLabel: string;
  syringeUnits?: number;
  phase?: string;
  notes?: string;
}

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function daysBetween(a: Date, b: Date): number {
  const ms = parseDate(formatDate(b)).getTime() - parseDate(formatDate(a)).getTime();
  return Math.round(ms / 86_400_000);
}

function isTwiceWeeklyTestDay(d: Date, start: Date): boolean {
  const day = d.getDay();
  const startDay = start.getDay();
  return day === startDay || day === (startDay + 3) % 7;
}

function retaDoseMg(dayIndex: number): number {
  return dayIndex < 14 ? 0.25 : 0.5;
}

function ghkDoseAndPhase(dayIndex: number): { dose: number; phase: string; active: boolean } {
  if (dayIndex < 0) return { dose: 0, phase: "Not started", active: false };
  const cycleDay = dayIndex % 60;
  if (cycleDay >= 30) return { dose: 0, phase: "Off cycle (30 days off)", active: false };
  const dose = cycleDay < 14 ? 0.5 : 1;
  const phase = cycleDay < 14 ? "Ramp (0.5 mg)" : "Maintenance (1 mg)";
  return { dose, phase, active: true };
}

function melanotanDose(
  dayIndex: number,
  date: Date
): { dose: number; phase: string; active: boolean } {
  if (dayIndex < 0) return { dose: 0, phase: "Not started", active: false };

  const week = Math.floor(dayIndex / 7);

  if (week < 1) {
    const d = dayIndex;
    if (d <= 2) return { dose: 0.25, phase: "Loading — days 1–3", active: true };
    return { dose: 0.5, phase: "Loading — days 4–7", active: true };
  }

  if (week === 1) {
    return { dose: 0.75, phase: "Loading — week 2", active: true };
  }

  if (week >= 2 && week <= 5) {
    const tanningDays = [2, 4, 6, 0];
    if (!tanningDays.includes(date.getDay())) {
      return { dose: 0, phase: "Tanning phase — rest day", active: false };
    }
    return { dose: 0.75, phase: "Tanning — dose 30–60 min before UV", active: true };
  }

  if (week >= 6 && week <= 11) {
    const maintDays = [1, 3, 5];
    if (!maintDays.includes(date.getDay())) {
      return { dose: 0, phase: "Maintenance — rest day", active: false };
    }
    return { dose: 0.375, phase: "Maintenance (2–3× weekly)", active: true };
  }

  return { dose: 0, phase: "Program complete", active: false };
}

/** Week 1: 1 IU · week 2: 2 IU · week 3+: 4 IU (daily). */
function hghDoseIu(dayIndex: number): { iu: number; phase: string } {
  if (dayIndex < 7) return { iu: 1, phase: "Week 1 (1 IU daily)" };
  if (dayIndex < 14) return { iu: 2, phase: "Week 2 (2 IU daily)" };
  return { iu: 4, phase: "Week 3+ (4 IU daily)" };
}

export function generateDosesForDate(dateIso: string): ScheduledDose[] {
  if (!isProgramDay(dateIso)) return [];
  const date = parseDate(dateIso);
  const doses: ScheduledDose[] = [];
  const testStart = parseDate(TEST_START);
  const retaStart = parseDate(RETATRUTIDE_START);
  const ghkStart = parseDate(GHK_START);
  const mtStart = parseDate(MELANOTAN_START);
  const hghStart = parseDate(HGH_START);
  const retaMgPerMl = 10 / BAC_ML;
  const ghkMgPerMl = 100 / BAC_ML;
  const mtMgPerMl = 10 / BAC_ML;

  if (date >= testStart && isTwiceWeeklyTestDay(date, testStart)) {
    doses.push({
      id: `${dateIso}-test`,
      date: dateIso,
      compound: "Testosterone Cypionate",
      doseLabel: "150 mg IM",
      notes: "Twice weekly — glute or delt IM",
    });
  }

  if (date >= retaStart && isTwiceWeeklyTestDay(date, retaStart)) {
    const retaDayIndex = daysBetween(retaStart, date);
    const mg = retaDoseMg(retaDayIndex);
    const units = syringeUnits(mg, retaMgPerMl);
    doses.push({
      id: `${dateIso}-reta`,
      date: dateIso,
      compound: "Retatrutide",
      doseLabel: `${mg} mg SC`,
      syringeUnits: units,
      phase: retaDayIndex < 14 ? "Weeks 1–2 (0.25 mg)" : "Week 3+ (0.5 mg)",
      notes: formatUnits(units),
    });
  }

  const ghkIndex = daysBetween(ghkStart, date);
  const ghk = ghkDoseAndPhase(ghkIndex);
  if (date >= ghkStart && ghk.active) {
    const units = syringeUnits(ghk.dose, ghkMgPerMl);
    doses.push({
      id: `${dateIso}-ghk`,
      date: dateIso,
      compound: "GHK-Cu",
      doseLabel: `${ghk.dose} mg`,
      syringeUnits: units,
      phase: ghk.phase,
      notes: formatUnits(units),
    });
  }

  const mtIndex = daysBetween(mtStart, date);
  const mt = melanotanDose(mtIndex, date);
  if (date >= mtStart && mt.active) {
    const units = syringeUnits(mt.dose, mtMgPerMl);
    doses.push({
      id: `${dateIso}-mt2`,
      date: dateIso,
      compound: "Melanotan II",
      doseLabel: `${mt.dose} mg`,
      syringeUnits: units,
      phase: mt.phase,
      notes: formatUnits(units),
    });
  }

  if (date >= hghStart) {
    const hghIndex = daysBetween(hghStart, date);
    const hgh = hghDoseIu(hghIndex);
    doses.push({
      id: `${dateIso}-hgh`,
      date: dateIso,
      compound: "HGH",
      doseLabel: `${hgh.iu} IU SC`,
      phase: hgh.phase,
      notes: "Daily — subcutaneous",
    });
  }

  return doses;
}

export function generateDoseRange(startIso: string, days: number): ScheduledDose[] {
  const start = parseDate(startIso);
  const all: ScheduledDose[] = [];
  for (let i = 0; i < days; i++) {
    const iso = formatDate(addDays(start, i));
    all.push(...generateDosesForDate(iso));
  }
  return all;
}

export function doseAbbreviation(compound: string): string {
  if (compound.includes("Testosterone")) return "Test";
  if (compound.includes("Retatrutide")) return "Reta";
  if (compound.includes("GHK")) return "GHK";
  if (compound.includes("Melanotan")) return "MT2";
  if (compound === "HGH") return "HGH";
  return compound.split(" ")[0] ?? compound;
}

/** Short label for calendar cells, e.g. "Test · Reta · GHK". */
export function dayDoseSummary(doses: ScheduledDose[]): string {
  if (!doses.length) return "";
  return doses.map((d) => doseAbbreviation(d.compound)).join(" · ");
}

export const SYRINGE_REFERENCE = [
  {
    compound: "Retatrutide (10 mg / 3 mL)",
    rows: [
      { dose: "0.25 mg", units: syringeUnits(0.25, 10 / BAC_ML) },
      { dose: "0.5 mg", units: syringeUnits(0.5, 10 / BAC_ML) },
      { dose: "1.0 mg", units: syringeUnits(1, 10 / BAC_ML) },
    ],
  },
  {
    compound: "GHK-Cu (100 mg / 3 mL)",
    rows: [
      { dose: "0.5 mg", units: syringeUnits(0.5, 100 / BAC_ML) },
      { dose: "1.0 mg", units: syringeUnits(1, 100 / BAC_ML) },
    ],
  },
  {
    compound: "Melanotan II (10 mg / 3 mL)",
    rows: [
      { dose: "0.25 mg", units: syringeUnits(0.25, 10 / BAC_ML) },
      { dose: "0.5 mg", units: syringeUnits(0.5, 10 / BAC_ML) },
      { dose: "0.75 mg", units: syringeUnits(0.75, 10 / BAC_ML) },
      { dose: "1.0 mg", units: syringeUnits(1, 10 / BAC_ML) },
    ],
  },
];
