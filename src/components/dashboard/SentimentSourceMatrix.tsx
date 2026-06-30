import type { SourceMatrixRow } from "@/lib/sentiment/types";
import { scoreToHeatColor } from "@/lib/sentiment/sourceMatrix";
import { formatSentimentScore } from "@/components/dashboard/sentimentDisplay";

function Cell({ score, count }: { score: number; count: number }) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[4.5rem]">
      <div
        className={`flex h-10 w-full items-center justify-center rounded-md border border-white/10 ${scoreToHeatColor(score)} transition-colors`}
        title={formatSentimentScore(score)}
      >
        <span className="text-xs font-bold tabular-nums text-white drop-shadow-sm">
          {formatSentimentScore(score)}
        </span>
      </div>
      <span className="text-[9px] text-white/35">{count} items</span>
    </div>
  );
}

export default function SentimentSourceMatrix({ rows }: { rows: SourceMatrixRow[] }) {
  if (!rows.length) {
    return <p className="text-sm text-white/50">No source data for this period.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-[10px] text-white/45">
        <span className="uppercase tracking-wide font-semibold">Scale</span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-6 rounded bg-red-500" /> Negative
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-6 rounded bg-amber-500/50" /> Neutral
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-6 rounded bg-emerald-500" /> Positive
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-white/50">
              <th className="pb-3 pr-4 font-semibold">Source</th>
              <th className="pb-3 px-2 font-semibold text-center">24 hr</th>
              <th className="pb-3 px-2 font-semibold text-center">Week</th>
              <th className="pb-3 px-2 font-semibold text-center">Month</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((row) => (
              <tr key={row.source}>
                <td className="py-3 pr-4 align-middle">
                  <p className="font-medium text-white/90">{row.label}</p>
                  <p className="text-[10px] text-white/35">{row.source.replace(/_/g, " ")}</p>
                </td>
                <td className="py-3 px-2 align-middle">
                  <Cell score={row.h24.score} count={row.h24.count} />
                </td>
                <td className="py-3 px-2 align-middle">
                  <Cell score={row.week.score} count={row.week.count} />
                </td>
                <td className="py-3 px-2 align-middle">
                  <Cell score={row.month.score} count={row.month.count} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
