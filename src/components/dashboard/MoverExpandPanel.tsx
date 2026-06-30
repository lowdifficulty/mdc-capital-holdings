"use client";

import type { SentimentMover } from "@/lib/sentiment/types";
import SimplePriceChart from "@/components/dashboard/SimplePriceChart";
import SentimentQuickPanel from "@/components/dashboard/SentimentQuickPanel";

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
          <button
            type="button"
            onClick={onOpenSentiment}
            className="text-lg font-bold tracking-tight text-white hover:text-mdc-blue transition"
          >
            {mover.symbol}
          </button>
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

      <SentimentQuickPanel
        symbol={mover.symbol}
        scores={{ h24: mover.h24Score, week: mover.weekScore, month: mover.monthScore }}
        onOpenSentiment={onOpenSentiment}
      />
    </div>
  );
}
