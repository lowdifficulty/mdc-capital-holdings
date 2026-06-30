"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PositionWithQuote, PositionsReport } from "@/lib/positions/types";
import type { MoversReport } from "@/lib/sentiment/types";
import { scoreColor, formatSentimentScore } from "@/components/dashboard/sentimentDisplay";

function formatMoney(value?: number): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  return abs >= 1000
    ? value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

function formatPrice(price?: number): string {
  if (price == null) return "—";
  return price >= 1000 ? `$${price.toFixed(0)}` : `$${price.toFixed(2)}`;
}

function formatShares(shares: number): string {
  return Number.isInteger(shares) ? String(shares) : shares.toFixed(1);
}

function formatAvgCost(avgCost: number): string {
  return avgCost.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPct(pct?: number): string {
  if (pct == null) return "—";
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function pnlColor(value?: number): string {
  if (value == null) return "text-white/40";
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-red-400";
  return "text-white/60";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function SentimentBadge({ score }: { score?: number }) {
  if (score == null) {
    return <span className="text-white/30 text-[10px]">—</span>;
  }
  return (
    <span
      className={`inline-flex rounded border font-semibold tabular-nums px-1 py-0 text-[10px] leading-5 ${scoreColor(score)}`}
    >
      {formatSentimentScore(score)}
    </span>
  );
}

type SentimentScores = { h24: number; week: number; month: number };

function PositionRow({
  position,
  sentiment,
  onOpenSentiment,
}: {
  position: PositionWithQuote;
  sentiment?: SentimentScores;
  onOpenSentiment: () => void;
}) {
  return (
    <tr className="hover:bg-white/5">
      <td className="px-1.5 py-2 font-semibold truncate">
        <button
          type="button"
          onClick={onOpenSentiment}
          className="hover:text-mdc-blue transition"
        >
          {position.symbol}
        </button>
      </td>
      <td className="px-1 py-2 tabular-nums text-white/70 text-center">
        {formatShares(position.shares)}
      </td>
      <td className="px-1 py-2 tabular-nums text-white/70 text-right">
        {formatAvgCost(position.avgCost)}
      </td>
      <td className="px-1.5 py-2 tabular-nums">{formatPrice(position.price)}</td>
      <td className="px-1.5 py-2 tabular-nums">{formatMoney(position.marketValue)}</td>
      <td className={`px-1.5 py-2 tabular-nums font-medium ${pnlColor(position.unrealizedPnL)}`}>
        {formatMoney(position.unrealizedPnL)}
      </td>
      <td className={`px-1.5 py-2 tabular-nums ${pnlColor(position.unrealizedPnLPct)}`}>
        {formatPct(position.unrealizedPnLPct)}
      </td>
      <td className={`px-1.5 py-2 tabular-nums font-medium ${pnlColor(position.dailyPnL)}`}>
        {formatMoney(position.dailyPnL)}
      </td>
      <td className="px-1 py-2">
        <SentimentBadge score={sentiment?.h24} />
      </td>
      <td className="px-1 py-2">
        <SentimentBadge score={sentiment?.week} />
      </td>
      <td className="px-1 py-2">
        <SentimentBadge score={sentiment?.month} />
      </td>
    </tr>
  );
}

export default function PositionsPanel({
  onPositionsChange,
  onOpenSentiment,
}: {
  onPositionsChange: (symbols: string[]) => void;
  onOpenSentiment: (symbol: string) => void;
}) {
  const [report, setReport] = useState<PositionsReport | null>(null);
  const [movers, setMovers] = useState<MoversReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const sentimentBySymbol = useMemo(() => {
    const map = new Map<string, SentimentScores>();
    for (const m of movers?.movers ?? []) {
      map.set(m.symbol, { h24: m.h24Score, week: m.weekScore, month: m.monthScore });
    }
    return map;
  }, [movers]);

  const loadPositions = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const res = await fetch("/api/positions", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to load positions");
      const data = (await res.json()) as PositionsReport;
      setReport(data);
      onPositionsChange(data.positions.map((p) => p.symbol));
    } catch {
      setError("Could not load positions. Try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onPositionsChange]);

  const loadMovers = useCallback(async () => {
    try {
      const res = await fetch("/api/sentiment?view=movers", { credentials: "same-origin" });
      if (!res.ok) return;
      setMovers((await res.json()) as MoversReport);
    } catch {
      /* sentiment columns optional */
    }
  }, []);

  useEffect(() => {
    void loadPositions();
    void loadMovers();
  }, [loadPositions, loadMovers]);

  useEffect(() => {
    const id = window.setInterval(() => void loadPositions({ silent: true }), 60_000);
    return () => window.clearInterval(id);
  }, [loadPositions]);

  if (loading && !report) {
    return <p className="mt-12 text-center text-white/50">Loading your positions…</p>;
  }

  const summary = report?.summary;
  const positions = report?.positions ?? [];

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <p className="text-sm text-white/55">
            Live P&amp;L across your holdings. Click a symbol for 24 hr sentiment analysis.
            Prices auto-refresh every 60 seconds.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void loadPositions({ silent: true });
            void loadMovers();
          }}
          disabled={refreshing}
          className="shrink-0 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-mdc-blue hover:text-white disabled:opacity-50"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      {positions.length > 0 && summary && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">Market value</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{formatMoney(summary.totalMarketValue)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">Cost basis</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{formatMoney(summary.totalCostBasis)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">Unrealized P&amp;L</p>
            <p className={`mt-2 text-2xl font-semibold tabular-nums ${pnlColor(summary.totalUnrealizedPnL)}`}>
              {formatMoney(summary.totalUnrealizedPnL)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">Return</p>
            <p className={`mt-2 text-2xl font-semibold tabular-nums ${pnlColor(summary.totalUnrealizedPnLPct)}`}>
              {formatPct(summary.totalUnrealizedPnLPct)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">Today&apos;s P&amp;L</p>
            <p className={`mt-2 text-2xl font-semibold tabular-nums ${pnlColor(summary.totalDailyPnL)}`}>
              {formatMoney(summary.totalDailyPnL)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">Today</p>
            <p className={`mt-2 text-2xl font-semibold tabular-nums ${pnlColor(summary.totalDailyPnLPct)}`}>
              {formatPct(summary.totalDailyPnLPct)}
            </p>
          </div>
        </div>
      )}

      {positions.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center">
          <p className="text-sm text-white/60">No positions yet.</p>
          <p className="mt-2 text-xs text-white/40">Share a brokerage screenshot to sync your holdings.</p>
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {positions.map((p) => {
              const sentiment = sentimentBySymbol.get(p.symbol);
              return (
                <article
                  key={p.symbol}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenSentiment(p.symbol)}
                      className="text-left"
                    >
                      <p className="text-lg font-semibold hover:text-mdc-blue">{p.symbol}</p>
                      <p className="text-sm tabular-nums text-white/50">{formatPrice(p.price)}</p>
                    </button>
                    <p className="text-xs tabular-nums text-white/45">
                      {formatShares(p.shares)} @ {formatAvgCost(p.avgCost)}
                    </p>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-white/40">P&amp;L</p>
                      <p className={`tabular-nums font-medium ${pnlColor(p.unrealizedPnL)}`}>
                        {formatMoney(p.unrealizedPnL)}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/40">Today</p>
                      <p className={`tabular-nums font-medium ${pnlColor(p.dailyPnL)}`}>
                        {formatMoney(p.dailyPnL)}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/40">Value</p>
                      <p className="tabular-nums">{formatMoney(p.marketValue)}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <SentimentBadge score={sentiment?.h24} />
                    <SentimentBadge score={sentiment?.week} />
                    <SentimentBadge score={sentiment?.month} />
                  </div>
                </article>
              );
            })}
          </div>
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full table-fixed text-xs">
              <colgroup>
                <col className="w-[7%]" />
                <col className="w-[4%]" />
                <col className="w-[5%]" />
                <col className="w-[6%]" />
                <col className="w-[7%]" />
                <col className="w-[7%]" />
                <col className="w-[6%]" />
                <col className="w-[7%]" />
                <col className="w-[5%]" />
                <col className="w-[5%]" />
                <col className="w-[5%]" />
              </colgroup>
              <thead className="bg-navy/95 text-left text-[10px] uppercase tracking-wide text-white/50">
                <tr>
                  <th className="px-1.5 py-2">Sym</th>
                  <th className="px-1 py-2 text-center">Qty</th>
                  <th className="px-1 py-2 text-right">Avg</th>
                  <th className="px-1.5 py-2">$</th>
                  <th className="px-1.5 py-2">Value</th>
                  <th className="px-1.5 py-2">P&amp;L</th>
                  <th className="px-1.5 py-2">Ret</th>
                  <th className="px-1.5 py-2">Day</th>
                  <th className="px-1 py-2">24h</th>
                  <th className="px-1 py-2">7d</th>
                  <th className="px-1 py-2">30d</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {positions.map((p) => (
                  <PositionRow
                    key={p.symbol}
                    position={p}
                    sentiment={sentimentBySymbol.get(p.symbol)}
                    onOpenSentiment={() => onOpenSentiment(p.symbol)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {report?.updatedAt && positions.length > 0 && (
        <p className="text-xs text-white/40">
          Prices updated {formatTime(report.updatedAt)} · Yahoo Finance · auto-refresh 60s
        </p>
      )}
    </div>
  );
}
