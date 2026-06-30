import type { SentimentLabel, SentimentSource, SourceBreakdown, SourceMatrixRow } from "./types";

export function buildSourceMatrix(
  h24Sources: SourceBreakdown[],
  weekSources: SourceBreakdown[],
  monthSources: SourceBreakdown[],
  labels: Record<SentimentSource, string>
): SourceMatrixRow[] {
  const allSources = new Set<SentimentSource>();
  for (const s of h24Sources) allSources.add(s.source);
  for (const s of weekSources) allSources.add(s.source);
  for (const s of monthSources) allSources.add(s.source);

  const h24Map = new Map(h24Sources.map((s) => [s.source, s]));
  const weekMap = new Map(weekSources.map((s) => [s.source, s]));
  const monthMap = new Map(monthSources.map((s) => [s.source, s]));

  const neutral = { score: 0, label: "neutral" as SentimentLabel, count: 0 };

  return Array.from(allSources)
    .map((source) => {
      const h = h24Map.get(source);
      const w = weekMap.get(source);
      const m = monthMap.get(source);
      return {
        source,
        label: labels[source] ?? source,
        h24: h
          ? { score: h.averageScore, label: h.labelSummary, count: h.count }
          : neutral,
        week: w
          ? { score: w.averageScore, label: w.labelSummary, count: w.count }
          : neutral,
        month: m
          ? { score: m.averageScore, label: m.labelSummary, count: m.count }
          : neutral,
      };
    })
    .sort(
      (a, b) =>
        b.h24.count + b.week.count + b.month.count - (a.h24.count + a.week.count + a.month.count)
    );
}

export function scoreToHeatColor(score: number): string {
  if (score >= 0.35) return "bg-emerald-500";
  if (score >= 0.12) return "bg-emerald-600/70";
  if (score >= 0.04) return "bg-emerald-700/40";
  if (score <= -0.35) return "bg-red-500";
  if (score <= -0.12) return "bg-red-600/70";
  if (score <= -0.04) return "bg-red-700/40";
  return "bg-amber-500/50";
}
