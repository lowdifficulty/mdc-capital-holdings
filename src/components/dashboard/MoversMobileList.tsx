"use client";

import type { SentimentMover } from "@/lib/sentiment/types";
import {
  formatSentimentScore,
  formatMentions,
  scoreColor,
  scoreTextColor,
} from "@/components/dashboard/sentimentDisplay";
import MoverExpandPanel from "@/components/dashboard/MoverExpandPanel";

function formatPrice(price?: number): string {
  if (price == null) return "—";
  return price >= 1000 ? `$${price.toFixed(0)}` : `$${price.toFixed(2)}`;
}

function formatPct(pct?: number): string {
  if (pct == null) return "—";
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function pctColor(pct?: number): string {
  if (pct == null) return "text-white/40";
  if (pct > 0) return "text-emerald-400";
  if (pct < 0) return "text-red-400";
  return "text-white/60";
}

function directionShort(m: SentimentMover): string {
  if (m.direction === "heating_up") return "↑";
  if (m.direction === "cooling_down") return "↓";
  return "—";
}

function MetricCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-white/[0.04] px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wide text-white/40">{label}</p>
      <div className="mt-1 text-sm font-medium tabular-nums">{children}</div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span
      className={`inline-flex rounded border font-semibold tabular-nums px-1.5 py-0.5 text-xs ${scoreColor(score)}`}
    >
      {formatSentimentScore(score)}
    </span>
  );
}

export default function MoversMobileList({
  movers,
  expandedSymbol,
  watchlist,
  onToggleExpand,
  onToggleWatch,
  onOpenSentiment,
}: {
  movers: SentimentMover[];
  expandedSymbol: string | null;
  watchlist: string[];
  onToggleExpand: (m: SentimentMover) => void;
  onToggleWatch: (symbol: string, e: React.MouseEvent) => void;
  onOpenSentiment: (symbol: string) => void;
}) {
  return (
    <div className="md:hidden space-y-3">
      {movers.map((m, i) => {
        const isExpanded = expandedSymbol === m.symbol;
        const watching = watchlist.includes(m.symbol.toUpperCase());

        return (
          <article
            key={m.symbol}
            className={`rounded-2xl border overflow-hidden ${
              isExpanded ? "border-mdc-blue/40 bg-white/[0.04]" : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => onToggleExpand(m)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] tabular-nums text-white/35">
                          #{m.rank ?? i + 1}
                        </span>
                        <span className="text-base font-bold">{m.symbol}</span>
                        <span className="text-white/35 text-xs">{isExpanded ? "▼" : "▶"}</span>
                      </div>
                      {m.name && (
                        <p className="mt-0.5 truncate text-xs text-white/45">{m.name}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-base font-semibold tabular-nums">{formatPrice(m.price)}</p>
                      <p className={`text-xs tabular-nums ${pctColor(m.dailyChange)}`}>
                        {formatPct(m.dailyChange)} day
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  aria-label={
                    watching ? `Remove ${m.symbol} from Watching` : `Add ${m.symbol} to Watching`
                  }
                  onClick={(e) => onToggleWatch(m.symbol, e)}
                  className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold ${
                    watching
                      ? "border-mdc-blue bg-mdc-blue/20 text-mdc-blue"
                      : "border-white/20 text-white/50"
                  }`}
                >
                  {watching ? "✓" : "+"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => onToggleExpand(m)}
                className="mt-3 w-full text-left"
              >
                <div className="grid grid-cols-3 gap-2">
                  <MetricCell label="Day">
                    <span className={pctColor(m.dailyChange)}>{formatPct(m.dailyChange)}</span>
                  </MetricCell>
                  <MetricCell label="Wk">
                    <span className={pctColor(m.weeklyChange)}>{formatPct(m.weeklyChange)}</span>
                  </MetricCell>
                  <MetricCell label="Mo">
                    <span className={pctColor(m.monthlyChange)}>{formatPct(m.monthlyChange)}</span>
                  </MetricCell>
                  <MetricCell label="24h">
                    <ScoreBadge score={m.h24Score} />
                  </MetricCell>
                  <MetricCell label="7d">
                    <ScoreBadge score={m.weekScore} />
                  </MetricCell>
                  <MetricCell label="30d">
                    <ScoreBadge score={m.monthScore} />
                  </MetricCell>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
                  <span>
                    Vel{" "}
                    <span className={`font-semibold ${scoreTextColor(m.velocity)}`}>
                      {formatSentimentScore(m.velocity)}
                    </span>
                  </span>
                  <span>Mnt {formatMentions(m.weekMentions)}</span>
                  <span>Sig {directionShort(m)}</span>
                </div>
              </button>
            </div>

            {isExpanded && (
              <MoverExpandPanel
                mover={m}
                onOpenSentiment={() => onOpenSentiment(m.symbol)}
              />
            )}
          </article>
        );
      })}
    </div>
  );
}
