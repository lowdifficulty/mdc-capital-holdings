"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CongressCluster, TickerDailyScore } from "@/lib/quiver/types";

function formatMoney(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

function recColor(label: string): string {
  if (label.includes("Bullish")) return "text-emerald-400 border-emerald-400/40 bg-emerald-500/10";
  if (label.includes("Bearish")) return "text-red-400 border-red-400/40 bg-red-500/10";
  if (label === "Caution") return "text-amber-400 border-amber-400/40 bg-amber-500/10";
  return "text-white/60 border-white/20 bg-white/5";
}

function scoreColor(n: number): string {
  if (n >= 45) return "text-emerald-400";
  if (n <= -45) return "text-red-400";
  if (n >= 20) return "text-teal-300";
  if (n <= -20) return "text-orange-300";
  return "text-white/70";
}

type SortKey = "sentiment" | "risk" | "value_to_risk" | "congress" | "insider";

interface RunStatus {
  lastRun?: { status: string; finishedAt?: string; errors: string[] };
  store?: { eventCount: number; tickerCount: number; lastSyncAt?: string };
}

export default function QuiverAnalysisPanel() {
  const [tickers, setTickers] = useState<TickerDailyScore[]>([]);
  const [clusters, setClusters] = useState<CongressCluster[]>([]);
  const [status, setStatus] = useState<RunStatus | null>(null);
  const [selected, setSelected] = useState<TickerDailyScore | null>(null);
  const [sort, setSort] = useState<SortKey>("value_to_risk");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [topRes, clusterRes, statusRes] = await Promise.all([
        fetch(`/api/analysis/top?sort=${sort}&limit=50`, { credentials: "same-origin" }),
        fetch("/api/analysis/congress/clusters?window=30", { credentials: "same-origin" }),
        fetch("/api/analysis/run-status", { credentials: "same-origin" }),
      ]);
      if (!topRes.ok) throw new Error("Failed to load analysis");
      const top = (await topRes.json()) as { tickers: TickerDailyScore[] };
      setTickers(top.tickers ?? []);
      if (clusterRes.ok) {
        const c = (await clusterRes.json()) as { clusters: CongressCluster[] };
        setClusters(c.clusters ?? []);
      }
      if (statusRes.ok) setStatus(await statusRes.json());
    } catch {
      setError("Could not load Quiver analysis. Run sync if this is your first visit.");
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    void load();
  }, [load]);

  const bullish = useMemo(
    () => tickers.filter((t) => t.total_sentiment_score >= 45).slice(0, 8),
    [tickers]
  );
  const bearish = useMemo(
    () =>
      [...tickers]
        .sort((a, b) => a.total_sentiment_score - b.total_sentiment_score)
        .filter((t) => t.total_sentiment_score <= -20)
        .slice(0, 8),
    [tickers]
  );
  const valueRisk = useMemo(
    () => [...tickers].sort((a, b) => b.value_to_risk_score - a.value_to_risk_score).slice(0, 8),
    [tickers]
  );

  async function runSync() {
    setRunning(true);
    setError("");
    try {
      const res = await fetch("/api/analysis/run", { method: "POST", credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return <p className="mt-12 text-center text-white/50">Loading QuiverQuant analysis…</p>;
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <p className="text-sm text-white/55">
            Alternative-data engine: Congress trades, insiders, 13F, contracts, lobbying, news, and more.
            Scores range from -100 (bearish) to +100 (bullish). Analysis only — no trade execution.
          </p>
          {status?.store && (
            <p className="mt-1 text-xs text-white/40">
              {status.store.eventCount.toLocaleString()} events · {status.store.tickerCount} tickers
              {status.store.lastSyncAt
                ? ` · synced ${new Date(status.store.lastSyncAt).toLocaleString()}`
                : ""}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["value_to_risk", "Value/Risk"],
              ["sentiment", "Sentiment"],
              ["congress", "Congress"],
              ["insider", "Insider"],
              ["risk", "Risk"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSort(key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                sort === key
                  ? "border-mdc-blue bg-mdc-blue/20 text-white"
                  : "border-white/20 text-white/60 hover:border-white/40"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void runSync()}
            disabled={running}
            className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {running ? "Syncing…" : "Sync Quiver data"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <div className="grid gap-3 lg:grid-cols-3">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-emerald-400/80">Top bullish</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {bullish.length === 0 && <li className="text-white/40">Run sync to populate.</li>}
            {bullish.map((t) => (
              <li key={t.ticker}>
                <button type="button" onClick={() => setSelected(t)} className="hover:text-mdc-blue w-full text-left">
                  <span className="font-semibold">{t.ticker}</span>
                  <span className={`ml-2 tabular-nums ${scoreColor(t.total_sentiment_score)}`}>
                    {formatMoney(t.total_sentiment_score)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-red-400/80">Top bearish</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {bearish.length === 0 && <li className="text-white/40">No bearish signals yet.</li>}
            {bearish.map((t) => (
              <li key={t.ticker}>
                <button type="button" onClick={() => setSelected(t)} className="hover:text-mdc-blue w-full text-left">
                  <span className="font-semibold">{t.ticker}</span>
                  <span className={`ml-2 tabular-nums ${scoreColor(t.total_sentiment_score)}`}>
                    {formatMoney(t.total_sentiment_score)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-mdc-blue/80">Best value / risk</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {valueRisk.map((t) => (
              <li key={t.ticker}>
                <button type="button" onClick={() => setSelected(t)} className="hover:text-mdc-blue w-full text-left">
                  <span className="font-semibold">{t.ticker}</span>
                  <span className="ml-2 tabular-nums text-white/60">V/R {formatMoney(t.value_to_risk_score)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {clusters.length > 0 && (
        <section className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-300/90">Congress trade clusters (30d)</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {clusters.slice(0, 12).map((c) => (
              <span
                key={`${c.ticker}-${c.direction}`}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  c.direction === "buy"
                    ? "border-emerald-400/30 text-emerald-300"
                    : "border-red-400/30 text-red-300"
                }`}
              >
                {c.ticker} · {c.count} {c.direction}s
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-xs">
          <thead className="bg-navy/95 text-left text-[10px] uppercase tracking-wide text-white/50">
            <tr>
              <th className="px-3 py-2">Ticker</th>
              <th className="px-3 py-2">Recommendation</th>
              <th className="px-3 py-2">Sentiment</th>
              <th className="px-3 py-2">Risk</th>
              <th className="px-3 py-2">V/R</th>
              <th className="px-3 py-2">Conf</th>
              <th className="px-3 py-2">Congress</th>
              <th className="px-3 py-2">Insider</th>
              <th className="px-3 py-2">13F</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {tickers.map((t) => (
              <tr
                key={t.ticker}
                className="hover:bg-white/5 cursor-pointer"
                onClick={() => setSelected(t)}
              >
                <td className="px-3 py-2 font-semibold">{t.ticker}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold ${recColor(t.recommendation)}`}>
                    {t.recommendation}
                  </span>
                </td>
                <td className={`px-3 py-2 tabular-nums ${scoreColor(t.total_sentiment_score)}`}>
                  {formatMoney(t.total_sentiment_score)}
                </td>
                <td className="px-3 py-2 tabular-nums text-white/70">{t.risk_score}</td>
                <td className="px-3 py-2 tabular-nums text-white/70">{formatMoney(t.value_to_risk_score)}</td>
                <td className="px-3 py-2 tabular-nums text-white/50">{t.confidence_score}%</td>
                <td className="px-3 py-2 tabular-nums">{formatMoney(t.congress_score)}</td>
                <td className="px-3 py-2 tabular-nums">{formatMoney(t.insider_score)}</td>
                <td className="px-3 py-2 tabular-nums">{formatMoney(t.hedge_fund_score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <section className="rounded-2xl border border-mdc-blue/30 bg-mdc-blue/5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">{selected.ticker}</h3>
              <span className={`mt-1 inline-flex rounded border px-2 py-0.5 text-xs font-semibold ${recColor(selected.recommendation)}`}>
                {selected.recommendation}
              </span>
            </div>
            <button type="button" onClick={() => setSelected(null)} className="text-white/40 hover:text-white text-sm">
              Close
            </button>
          </div>
          <p className="mt-4 text-sm text-white/70 leading-relaxed">{selected.explanation.summary}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[10px] uppercase text-white/40">Sentiment</p>
              <p className={`text-lg font-semibold tabular-nums ${scoreColor(selected.total_sentiment_score)}`}>
                {formatMoney(selected.total_sentiment_score)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[10px] uppercase text-white/40">Risk</p>
              <p className="text-lg font-semibold tabular-nums">{selected.risk_score}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[10px] uppercase text-white/40">Value / Risk</p>
              <p className="text-lg font-semibold tabular-nums">{formatMoney(selected.value_to_risk_score)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[10px] uppercase text-white/40">Confidence</p>
              <p className="text-lg font-semibold tabular-nums">{selected.confidence_score}%</p>
            </div>
          </div>
          {selected.explanation.drivers.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400/70">Drivers</p>
              <ul className="mt-2 space-y-1 text-sm text-white/65">
                {selected.explanation.drivers.map((d, i) => (
                  <li key={i}>· {d}</li>
                ))}
              </ul>
            </div>
          )}
          {selected.explanation.risks.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/70">Risk factors</p>
              <ul className="mt-2 space-y-1 text-sm text-white/65">
                {selected.explanation.risks.map((d, i) => (
                  <li key={i}>· {d}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-white/40 text-left">
                  <th className="py-1 pr-4">Dataset</th>
                  <th className="py-1 pr-4">Score</th>
                  <th className="py-1 pr-4">Conf</th>
                  <th className="py-1">Weight</th>
                </tr>
              </thead>
              <tbody>
                {selected.explanation.datasetBreakdown.map((d) => (
                  <tr key={d.dataset} className="border-t border-white/5">
                    <td className="py-1.5 pr-4">{d.dataset.replace(/_/g, " ")}</td>
                    <td className={`py-1.5 pr-4 tabular-nums ${scoreColor(d.score)}`}>{d.score}</td>
                    <td className="py-1.5 pr-4 tabular-nums">{d.confidence}%</td>
                    <td className="py-1.5 tabular-nums">{(d.weight * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
