"use client";

import type { SentimentMover } from "@/lib/sentiment/types";
import {
  formatSentimentScore,
  scoreColor,
} from "@/components/dashboard/sentimentDisplay";
import SimplePriceChart from "@/components/dashboard/SimplePriceChart";

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

export default function MoverExpandPanel({
  mover,
  onOpenSentiment,
}: {
  mover: SentimentMover;
  onOpenSentiment: () => void;
}) {
  return (
    <div className="w-full max-w-full overflow-hidden border-t border-mdc-blue/20 bg-navy/80 px-3 py-4 sm:px-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-bold tracking-tight">{mover.symbol}</p>
          <p className="truncate text-sm text-white/50">{mover.name ?? "—"}</p>
        </div>
        {mover.price != null && (
          <div className="shrink-0 text-right">
            <p className="text-xl font-semibold tabular-nums">{formatPrice(mover.price)}</p>
            <p className={`text-xs tabular-nums ${pctColor(mover.dailyChange)}`}>
              {formatPct(mover.dailyChange)} today
            </p>
          </div>
        )}
      </div>

      <SimplePriceChart symbol={mover.symbol} />

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-white/10 pt-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/45">
          Sentiment
        </p>
        <div className="flex flex-wrap gap-2">
          <SentimentPill label="24 hr" score={mover.h24Score} />
          <SentimentPill label="Week" score={mover.weekScore} />
          <SentimentPill label="Month" score={mover.monthScore} />
        </div>
        <button
          type="button"
          onClick={onOpenSentiment}
          className="ml-auto text-sm text-mdc-blue hover:text-white"
        >
          Full sentiment analysis →
        </button>
      </div>
    </div>
  );
}

function SentimentPill({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-white/45">{label}</span>
      <span
        className={`rounded border px-2 py-0.5 font-semibold tabular-nums ${scoreColor(score)}`}
      >
        {formatSentimentScore(score)}
      </span>
    </div>
  );
}
