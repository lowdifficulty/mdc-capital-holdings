"use client";

import { useCallback, useEffect, useState } from "react";
import type { PositionWithQuote, PositionsReport } from "@/lib/positions/types";

function formatMoney(value?: number): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const formatted =
    abs >= 1000
      ? value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
      : value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
  return formatted;
}

function formatPrice(price?: number): string {
  if (price == null) return "—";
  return price >= 1000 ? `$${price.toFixed(0)}` : `$${price.toFixed(2)}`;
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

function PositionRow({
  position,
  onSave,
  onRemove,
}: {
  position: PositionWithQuote;
  onSave: (symbol: string, shares: number, avgCost: number) => Promise<void>;
  onRemove: (symbol: string) => Promise<void>;
}) {
  const [shares, setShares] = useState(String(position.shares || ""));
  const [avgCost, setAvgCost] = useState(String(position.avgCost || ""));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setShares(String(position.shares || ""));
    setAvgCost(String(position.avgCost || ""));
  }, [position.shares, position.avgCost]);

  const needsDetails = position.shares <= 0 || position.avgCost <= 0;

  async function handleSave() {
    const parsedShares = parseFloat(shares);
    const parsedCost = parseFloat(avgCost);
    if (!Number.isFinite(parsedShares) || parsedShares < 0) return;
    if (!Number.isFinite(parsedCost) || parsedCost < 0) return;
    setSaving(true);
    try {
      await onSave(position.symbol, parsedShares, parsedCost);
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="hover:bg-white/5">
      <td className="px-3 py-3 font-semibold">{position.symbol}</td>
      <td className="px-3 py-3">
        <input
          type="number"
          min="0"
          step="any"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          placeholder="0"
          className="w-full min-w-[72px] rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm tabular-nums outline-none focus:border-mdc-blue"
        />
      </td>
      <td className="px-3 py-3">
        <input
          type="number"
          min="0"
          step="0.01"
          value={avgCost}
          onChange={(e) => setAvgCost(e.target.value)}
          placeholder="0.00"
          className="w-full min-w-[80px] rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm tabular-nums outline-none focus:border-mdc-blue"
        />
      </td>
      <td className="px-3 py-3 tabular-nums">{formatPrice(position.price)}</td>
      <td className="px-3 py-3 tabular-nums">{formatMoney(position.marketValue)}</td>
      <td className={`px-3 py-3 tabular-nums font-medium ${pnlColor(position.unrealizedPnL)}`}>
        {formatMoney(position.unrealizedPnL)}
      </td>
      <td className={`px-3 py-3 tabular-nums ${pnlColor(position.unrealizedPnLPct)}`}>
        {formatPct(position.unrealizedPnLPct)}
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-full border border-mdc-blue/40 px-3 py-1 text-xs font-semibold text-mdc-blue hover:bg-mdc-blue/10 disabled:opacity-50"
          >
            {saving ? "…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => void onRemove(position.symbol)}
            aria-label={`Remove ${position.symbol} from positions`}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        </div>
        {needsDetails && (
          <p className="mt-1 text-[10px] text-amber-300/80">Enter shares &amp; avg cost for P&amp;L</p>
        )}
      </td>
    </tr>
  );
}

export default function PositionsPanel({
  onPositionsChange,
}: {
  onPositionsChange: (symbols: string[]) => void;
}) {
  const [report, setReport] = useState<PositionsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

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

  useEffect(() => {
    void loadPositions();
  }, [loadPositions]);

  async function handleSave(symbol: string, shares: number, avgCost: number) {
    const res = await fetch("/api/positions", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, shares, avgCost }),
    });
    if (!res.ok) throw new Error("failed");
    const data = (await res.json()) as PositionsReport;
    setReport(data);
    onPositionsChange(data.positions.map((p) => p.symbol));
  }

  async function handleRemove(symbol: string) {
    const res = await fetch(`/api/positions?symbol=${encodeURIComponent(symbol)}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (!res.ok) throw new Error("failed");
    const data = (await res.json()) as PositionsReport;
    setReport(data);
    onPositionsChange(data.positions.map((p) => p.symbol));
  }

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
            Track open positions and unrealized profit &amp; loss. Enter shares and average cost for
            each holding — or share a brokerage screenshot and we&apos;ll update the numbers for you.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadPositions({ silent: true })}
          disabled={refreshing}
          className="shrink-0 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-mdc-blue hover:text-white disabled:opacity-50"
        >
          {refreshing ? "Refreshing…" : "Refresh prices"}
        </button>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      {positions.length > 0 && summary && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">
              Market value
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {formatMoney(summary.totalMarketValue)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">
              Cost basis
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {formatMoney(summary.totalCostBasis)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">
              Unrealized P&amp;L
            </p>
            <p className={`mt-2 text-2xl font-semibold tabular-nums ${pnlColor(summary.totalUnrealizedPnL)}`}>
              {formatMoney(summary.totalUnrealizedPnL)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">
              Return
            </p>
            <p
              className={`mt-2 text-2xl font-semibold tabular-nums ${pnlColor(summary.totalUnrealizedPnLPct)}`}
            >
              {formatPct(summary.totalUnrealizedPnLPct)}
            </p>
          </div>
        </div>
      )}

      {positions.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center">
          <p className="text-sm text-white/60">No positions yet.</p>
          <p className="mt-2 text-xs text-white/40">
            Add stocks from the Watching section on the Movers tab, or share a brokerage screenshot
            here to get started.
          </p>
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {positions.map((p) => (
              <PositionMobileCard
                key={p.symbol}
                position={p}
                onSave={handleSave}
                onRemove={handleRemove}
              />
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-navy/95 text-left text-[10px] uppercase tracking-wide text-white/50">
                <tr>
                  <th className="px-3 py-3">Symbol</th>
                  <th className="px-3 py-3">Shares</th>
                  <th className="px-3 py-3">Avg cost</th>
                  <th className="px-3 py-3">Price</th>
                  <th className="px-3 py-3">Value</th>
                  <th className="px-3 py-3">P&amp;L</th>
                  <th className="px-3 py-3">Return</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {positions.map((p) => (
                  <PositionRow
                    key={p.symbol}
                    position={p}
                    onSave={handleSave}
                    onRemove={handleRemove}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {report?.updatedAt && positions.length > 0 && (
        <p className="text-xs text-white/40">
          Prices updated {formatTime(report.updatedAt)} · Yahoo Finance
        </p>
      )}
    </div>
  );
}

function PositionMobileCard({
  position,
  onSave,
  onRemove,
}: {
  position: PositionWithQuote;
  onSave: (symbol: string, shares: number, avgCost: number) => Promise<void>;
  onRemove: (symbol: string) => Promise<void>;
}) {
  const [shares, setShares] = useState(String(position.shares || ""));
  const [avgCost, setAvgCost] = useState(String(position.avgCost || ""));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const parsedShares = parseFloat(shares);
    const parsedCost = parseFloat(avgCost);
    if (!Number.isFinite(parsedShares) || parsedShares < 0) return;
    if (!Number.isFinite(parsedCost) || parsedCost < 0) return;
    setSaving(true);
    try {
      await onSave(position.symbol, parsedShares, parsedCost);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-semibold">{position.symbol}</p>
          <p className="text-sm tabular-nums text-white/50">{formatPrice(position.price)}</p>
        </div>
        <button
          type="button"
          onClick={() => void onRemove(position.symbol)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:bg-white/10"
        >
          ×
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-[10px] uppercase tracking-wide text-white/45">
          Shares
          <input
            type="number"
            min="0"
            step="any"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm tabular-nums"
          />
        </label>
        <label className="text-[10px] uppercase tracking-wide text-white/45">
          Avg cost
          <input
            type="number"
            min="0"
            step="0.01"
            value={avgCost}
            onChange={(e) => setAvgCost(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm tabular-nums"
          />
        </label>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-white/40">Value</p>
          <p className="tabular-nums">{formatMoney(position.marketValue)}</p>
        </div>
        <div>
          <p className="text-white/40">P&amp;L</p>
          <p className={`tabular-nums font-medium ${pnlColor(position.unrealizedPnL)}`}>
            {formatMoney(position.unrealizedPnL)}
          </p>
        </div>
        <div>
          <p className="text-white/40">Return</p>
          <p className={`tabular-nums ${pnlColor(position.unrealizedPnLPct)}`}>
            {formatPct(position.unrealizedPnLPct)}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving}
        className="mt-3 w-full rounded-full border border-mdc-blue/40 py-2 text-sm font-semibold text-mdc-blue hover:bg-mdc-blue/10 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </article>
  );
}
