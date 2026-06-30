"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChartRangeId, ChartSeries } from "@/lib/sentiment/chartData";
import { CHART_RANGES } from "@/lib/sentiment/chartData";

const W = 800;
const H = 200;
const ML = 54;
const MR = 8;
const MT = 10;
const MB = 26;
const CW = W - ML - MR;
const CH = H - MT - MB;

function formatPrice(n: number): string {
  if (n >= 10_000) return `$${(n / 1000).toFixed(1)}k`;
  return n >= 1000 ? `$${n.toFixed(0)}` : `$${n.toFixed(2)}`;
}

function formatPct(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function pctColor(pct: number): string {
  if (pct > 0) return "text-emerald-400";
  if (pct < 0) return "text-red-400";
  return "text-white/60";
}

function formatAxisDate(ts: number, range: ChartRangeId): string {
  const d = new Date(ts);
  if (range === "1d") {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (range === "5y") {
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildChart(
  points: { t: number; v: number }[],
  range: ChartRangeId
): {
  line: string;
  area: string;
  min: number;
  max: number;
  yLabels: { y: number; label: string }[];
  xLabels: { x: number; label: string }[];
} | null {
  if (points.length < 2) return null;

  const values = points.map((p) => p.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mid = (min + max) / 2;
  const span = max - min || 1;

  const coords = values.map((v, i) => {
    const x = ML + (values.length === 1 ? CW / 2 : (i / (values.length - 1)) * CW);
    const y = MT + CH - ((v - min) / span) * CH;
    return { x, y };
  });

  const line = coords.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${ML + CW},${MT + CH} L${ML},${MT + CH} Z`;

  const yFor = (v: number) => MT + CH - ((v - min) / span) * CH;
  const yLabels = [
    { y: yFor(max), label: formatPrice(max) },
    { y: yFor(mid), label: formatPrice(mid) },
    { y: yFor(min), label: formatPrice(min) },
  ];

  const pick = [0, Math.floor((points.length - 1) / 2), points.length - 1];
  const xLabels = pick.map((i) => ({
    x: coords[i].x,
    label: formatAxisDate(points[i].t, range),
  }));

  return { line, area, min, max, yLabels, xLabels };
}

export default function SimplePriceChart({ symbol }: { symbol: string }) {
  const [range, setRange] = useState<ChartRangeId>("5d");
  const [series, setSeries] = useState<ChartSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/sentiment?view=chart&symbol=${encodeURIComponent(symbol)}&range=${range}`
      );
      if (!res.ok) throw new Error("unavailable");
      setSeries(await res.json());
    } catch {
      setSeries(null);
      setError("Chart unavailable for this ticker.");
    } finally {
      setLoading(false);
    }
  }, [symbol, range]);

  useEffect(() => {
    void load();
  }, [load]);

  const up = (series?.changePct ?? 0) >= 0;
  const stroke = up ? "#34d399" : "#f87171";
  const fill = up ? "rgba(52, 211, 153, 0.12)" : "rgba(248, 113, 113, 0.12)";
  const chart =
    series && series.points.length >= 2 ? buildChart(series.points, range) : null;

  return (
    <div className="w-full max-w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-2 py-2 sm:px-3">
        <div className="flex max-w-full gap-1 overflow-x-auto">
          {CHART_RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition sm:px-3 ${
                range === r.id
                  ? "bg-mdc-blue text-white"
                  : "text-white/55 hover:bg-white/10 hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        {series && !loading && (
          <span className={`text-sm font-semibold tabular-nums ${pctColor(series.changePct)}`}>
            {formatPct(series.changePct)}
          </span>
        )}
      </div>

      <div className="relative w-full px-1 pb-1" style={{ height: 210 }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/40">
            Loading…
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/40">
            {error}
          </div>
        )}
        {chart && !loading && (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            className="h-full w-full"
            role="img"
            aria-label={`${symbol} price chart`}
          >
            {/* grid lines */}
            {chart.yLabels.map((yl) => (
              <line
                key={yl.label}
                x1={ML}
                y1={yl.y}
                x2={ML + CW}
                y2={yl.y}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="4 4"
              />
            ))}

            <path d={chart.area} fill={fill} />
            <path d={chart.line} fill="none" stroke={stroke} strokeWidth="2" />

            {/* Y-axis price labels */}
            {chart.yLabels.map((yl) => (
              <text
                key={`y-${yl.label}`}
                x={ML - 6}
                y={yl.y + 3}
                textAnchor="end"
                fill="rgba(255,255,255,0.4)"
                fontSize="10"
              >
                {yl.label}
              </text>
            ))}

            {/* X-axis date labels */}
            {chart.xLabels.map((xl, i) => (
              <text
                key={`x-${i}`}
                x={xl.x}
                y={H - 6}
                textAnchor={i === 0 ? "start" : i === chart.xLabels.length - 1 ? "end" : "middle"}
                fill="rgba(255,255,255,0.4)"
                fontSize="10"
              >
                {xl.label}
              </text>
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}
