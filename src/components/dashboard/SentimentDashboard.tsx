"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SentimentSourceMatrix from "@/components/dashboard/SentimentSourceMatrix";
import RecommendationsTab, {
  type RecommendationsPayload,
} from "@/components/dashboard/RecommendationsTab";
import {
  formatSentimentScore,
  scoreColor,
  scoreTextColor,
} from "@/components/dashboard/sentimentDisplay";
import type {
  MoversReport,
  SentimentMover,
  SentimentPeriod,
  SentimentReport,
} from "@/lib/sentiment/types";

const POLL_MS = 60_000;
const POPULAR_TICKERS = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL"];

type DashboardView = "recommendations" | SentimentPeriod | "movers";

function periodTitle(period: SentimentPeriod): string {
  if (period === "24h") return "24 hr sentiment";
  if (period === "week") return "7-day sentiment";
  return "30-day sentiment";
}

function periodFeedLabel(period: SentimentPeriod): string {
  if (period === "24h") return "Last 24 hours";
  if (period === "week") return "Last 7 days";
  return "Last 30 days";
}

function priorPeriodLabel(period: SentimentPeriod): string {
  if (period === "24h") return "vs prior 24 hours";
  if (period === "week") return "vs prior 23 days";
  return "vs prior 30 days";
}

function loadingPeriodLabel(view: DashboardView): string {
  if (view === "recommendations") return "Running recommendation engine…";
  if (view === "movers") return "Loading all tracked stocks…";
  if (view === "24h") return "Analyzing 24 hr sentiment…";
  if (view === "week") return "Analyzing 7-day sentiment…";
  return "Analyzing 30-day sentiment…";
}

type MoverSortKey =
  | "rank"
  | "symbol"
  | "name"
  | "price"
  | "dailyChange"
  | "weeklyChange"
  | "monthlyChange"
  | "h24Score"
  | "weekScore"
  | "monthScore"
  | "velocity"
  | "mentions"
  | "signal";

type SortDir = "asc" | "desc";

function compareMovers(a: SentimentMover, b: SentimentMover, key: MoverSortKey): number {
  switch (key) {
    case "rank":
      return (a.rank ?? 9999) - (b.rank ?? 9999);
    case "symbol":
      return a.symbol.localeCompare(b.symbol);
    case "name":
      return (a.name ?? "").localeCompare(b.name ?? "");
    case "price":
      return (a.price ?? -1) - (b.price ?? -1);
    case "dailyChange":
      return (a.dailyChange ?? -999) - (b.dailyChange ?? -999);
    case "weeklyChange":
      return (a.weeklyChange ?? -999) - (b.weeklyChange ?? -999);
    case "monthlyChange":
      return (a.monthlyChange ?? -999) - (b.monthlyChange ?? -999);
    case "h24Score":
      return a.h24Score - b.h24Score;
    case "weekScore":
      return a.weekScore - b.weekScore;
    case "monthScore":
      return a.monthScore - b.monthScore;
    case "velocity":
      return a.velocity - b.velocity;
    case "mentions":
      return a.weekMentions - b.weekMentions;
    case "signal": {
      const order = { heating_up: 2, stable: 1, cooling_down: 0 };
      return order[a.direction] - order[b.direction];
    }
  }
}

function sortMovers(
  items: SentimentMover[],
  key: MoverSortKey,
  dir: SortDir
): SentimentMover[] {
  const sorted = [...items].sort((a, b) => compareMovers(a, b, key));
  return dir === "desc" ? sorted.reverse() : sorted;
}

function SentimentBadge({ score, large }: { score: number; large?: boolean }) {
  return (
    <span
      className={`inline-flex rounded-md border font-semibold tabular-nums ${scoreColor(score)} ${
        large ? "px-4 py-2 text-2xl" : "px-2 py-0.5 text-xs"
      }`}
    >
      {formatSentimentScore(score)}
    </span>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function directionLabel(m: SentimentMover): string {
  if (m.direction === "heating_up") return "Heating up";
  if (m.direction === "cooling_down") return "Cooling down";
  return "Stable";
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

function pctColor(pct?: number): string {
  if (pct == null) return "text-white/40";
  if (pct > 0) return "text-emerald-400";
  if (pct < 0) return "text-red-400";
  return "text-white/60";
}

export default function SentimentDashboard() {
  const router = useRouter();
  const [view, setView] = useState<DashboardView>("recommendations");
  const [symbol, setSymbol] = useState("AAPL");
  const [draft, setDraft] = useState("AAPL");
  const [report, setReport] = useState<SentimentReport | null>(null);
  const [movers, setMovers] = useState<MoversReport | null>(null);
  const [recData, setRecData] = useState<RecommendationsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(true);
  const [error, setError] = useState("");
  const [recError, setRecError] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [moverSortKey, setMoverSortKey] = useState<MoverSortKey>("velocity");
  const [moverSortDir, setMoverSortDir] = useState<SortDir>("desc");

  const sortedMovers = useMemo(() => {
    if (!movers) return [];
    return sortMovers(movers.movers, moverSortKey, moverSortDir);
  }, [movers, moverSortKey, moverSortDir]);

  function handleMoverSort(key: MoverSortKey) {
    if (moverSortKey === key) {
      setMoverSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setMoverSortKey(key);
      setMoverSortDir(key === "symbol" || key === "name" ? "asc" : "desc");
    }
  }

  function sortIndicator(key: MoverSortKey): string {
    if (moverSortKey !== key) return "↕";
    return moverSortDir === "asc" ? "↑" : "↓";
  }

  const loadRecommendations = useCallback(
    async (silent = false) => {
      if (!silent) setRecLoading(true);
      setRecError("");
      try {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        if (!session.user) {
          router.replace("/login");
          return;
        }
        const res = await fetch("/api/recommendations");
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (!res.ok) throw new Error("Failed to load recommendations");
        setRecData((await res.json()) as RecommendationsPayload);
        setLastRefresh(new Date());
      } catch {
        setRecError("Could not load recommendations. Try again.");
      } finally {
        if (!silent) setRecLoading(false);
      }
    },
    [router]
  );

  const loadSentimentData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError("");

      try {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        if (!session.user) {
          router.replace("/login");
          return;
        }

        if (view === "movers") {
          const res = await fetch("/api/sentiment?view=movers");
          if (res.status === 401) {
            router.replace("/login");
            return;
          }
          if (!res.ok) throw new Error("Failed to load movers");
          setMovers((await res.json()) as MoversReport);
          setReport(null);
        } else {
          const res = await fetch(
            `/api/sentiment?symbol=${encodeURIComponent(symbol)}&period=${view}`
          );
          if (res.status === 401) {
            router.replace("/login");
            return;
          }
          if (!res.ok) throw new Error("Failed to load sentiment");
          setReport((await res.json()) as SentimentReport);
          setMovers(null);
        }

        setLastRefresh(new Date());
      } catch {
        setError("Could not load sentiment data. Try again.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [router, symbol, view]
  );

  const loadData = useCallback(
    async (silent = false) => {
      if (view === "recommendations") await loadRecommendations(silent);
      else await loadSentimentData(silent);
    },
    [view, loadRecommendations, loadSentimentData]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!autoRefresh || view === "recommendations") return;
    const id = window.setInterval(() => void loadSentimentData(true), POLL_MS);
    return () => window.clearInterval(id);
  }, [autoRefresh, view, loadSentimentData]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    const next = draft.trim().toUpperCase();
    if (!next) return;
    setSymbol(next);
    if (view === "movers") setView("24h");
  }

  const warnings = report?.warnings ?? movers?.warnings ?? [];

  return (
    <div className="min-h-screen bg-navy text-white">
      <header className="border-b border-white/10 bg-navy/90 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-md bg-mdc-blue text-xs font-bold"
            >
              MDC
            </Link>
            <div>
              <p className="text-sm font-semibold">Market Dashboard</p>
              <p className="text-xs text-white/50">Recommendations · Movers · Sentiment</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="text-sm text-white/60 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
          {(
            [
              ["recommendations", "Recommendations"],
              ["movers", "Movers"],
              ["24h", "24 hr"],
              ["week", "Week"],
              ["month", "Month"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                view === key
                  ? "bg-mdc-blue text-white"
                  : "border border-white/15 text-white/70 hover:border-white/30"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {view === "recommendations" && (
          <RecommendationsTab
            data={recData}
            loading={recLoading}
            error={recError}
            onRefresh={() => void loadRecommendations()}
          />
        )}

        {view !== "movers" && view !== "recommendations" && (
          <>
            <form onSubmit={handleAnalyze} className="mt-6 flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="ticker" className="block text-xs font-medium text-white/60 mb-1.5">
                  Stock ticker
                </label>
                <input
                  id="ticker"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.toUpperCase())}
                  className="w-full max-w-xs rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-mdc-blue focus:ring-2 focus:ring-mdc-blue/30"
                  placeholder="AAPL"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-mdc-blue px-6 py-2.5 text-sm font-semibold hover:bg-white hover:text-navy disabled:opacity-50"
              >
                Analyze
              </button>
              <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-white/30"
                />
                Auto-refresh (60s)
              </label>
            </form>

            <div className="mt-3 flex flex-wrap gap-2">
              {POPULAR_TICKERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setDraft(t);
                    setSymbol(t);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                    symbol === t
                      ? "bg-mdc-blue border-mdc-blue text-white"
                      : "border-white/15 text-white/70 hover:border-white/30"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </>
        )}

        {view === "movers" && (
          <p className="mt-6 text-sm text-white/55">
            All tracked tickers from ApeWisdom (Reddit) and SwaggyStocks (WSB), ranked by
            sentiment velocity and mention momentum. Click a row for full multi-source analysis.
          </p>
        )}

        {error && view !== "recommendations" && (
          <p className="mt-4 text-sm text-red-300">{error}</p>
        )}

        {loading && !report && !movers && view !== "recommendations" && (
          <p className="mt-12 text-center text-white/50">
            {loadingPeriodLabel(view)}
          </p>
        )}

        {report && view !== "movers" && view !== "recommendations" && (
          <div className="mt-8 space-y-8">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 lg:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                  {periodTitle(report.period)}
                </p>
                <p className="mt-3 font-serif text-4xl">{report.symbol}</p>
                {report.price && (
                  <div className="mt-2 flex flex-wrap items-baseline gap-3">
                    <span className="text-2xl font-semibold tabular-nums">
                      {formatPrice(report.price.price)}
                    </span>
                    <span className={`text-sm tabular-nums ${pctColor(report.price.dailyChange)}`}>
                      {formatPct(report.price.dailyChange)} today
                    </span>
                  </div>
                )}
                <div className="mt-4">
                  <SentimentBadge score={report.overallScore} large />
                </div>
                <p className="mt-4 text-xs text-white/45">
                  {report.mentionCount} mentions · {report.sources.length} active sources · Updated{" "}
                  {lastRefresh ? formatTime(lastRefresh.toISOString()) : "—"}
                </p>

                {report.comparison && (
                  <div className="mt-5 rounded-xl border border-white/10 bg-navy/50 p-3 text-xs space-y-2">
                    <p className="text-white/50 uppercase tracking-wide font-semibold">
                      {priorPeriodLabel(report.period)}
                    </p>
                    <p>
                      Sentiment velocity:{" "}
                      <span className={`tabular-nums ${scoreTextColor(report.comparison.velocity)}`}>
                        {formatSentimentScore(report.comparison.velocity)}
                      </span>
                    </p>
                    <p>
                      Mention velocity:{" "}
                      <span className="text-white/80">
                        {(report.comparison.mentionVelocity * 100).toFixed(0)}%
                      </span>{" "}
                      vs baseline
                    </p>
                    <p className="text-white/40">
                      Prior period: {report.comparison.priorMentionCount} mentions ·{" "}
                      <span className={scoreTextColor(report.comparison.priorScore)}>
                        {formatSentimentScore(report.comparison.priorScore)}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                  By source — sentiment matrix
                </p>
                <div className="mt-4">
                  <SentimentSourceMatrix rows={report.sourceMatrix} />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-4">
                {periodFeedLabel(report.period)}
              </p>
              <div className="space-y-3">
                {report.mentions.map((mention) => (
                  <article
                    key={mention.id}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {mention.url ? (
                          <a
                            href={mention.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-white hover:text-mdc-blue line-clamp-2"
                          >
                            {mention.title}
                          </a>
                        ) : (
                          <p className="text-sm font-medium line-clamp-2">{mention.title}</p>
                        )}
                        {mention.summary && (
                          <p className="mt-1 text-xs text-white/50 line-clamp-2">
                            {mention.summary}
                          </p>
                        )}
                      </div>
                      <SentimentBadge score={mention.score} />
                    </div>
                    <p className="mt-2 text-[10px] text-white/40 uppercase tracking-wide">
                      {mention.source.replace(/_/g, " ")}
                      {mention.publishedAt ? ` · ${formatTime(mention.publishedAt)}` : ""}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}

        {movers && view === "movers" && (
          <div className="mt-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-white/45">
                {movers.totalAnalyzed} stocks analyzed · Updated{" "}
                {lastRefresh ? formatTime(lastRefresh.toISOString()) : "—"}
              </p>
            </div>
            <div className="overflow-auto max-h-[70vh] rounded-2xl border border-white/10">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="sticky top-0 z-10 bg-navy/95 text-left text-xs uppercase tracking-wide text-white/50 backdrop-blur">
                  <tr>
                    {(
                      [
                        ["rank", "#"],
                        ["symbol", "Ticker"],
                        ["name", "Name"],
                        ["price", "Price"],
                        ["dailyChange", "Day %"],
                        ["weeklyChange", "Week %"],
                        ["monthlyChange", "Month %"],
                        ["h24Score", "24 hr"],
                        ["weekScore", "Week"],
                        ["monthScore", "Month"],
                        ["velocity", "Velocity"],
                        ["mentions", "Mentions"],
                        ["signal", "Signal"],
                      ] as const
                    ).map(([key, label]) => (
                      <th key={key} className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleMoverSort(key)}
                          className={`inline-flex items-center gap-1.5 transition hover:text-white ${
                            moverSortKey === key ? "text-white" : ""
                          }`}
                        >
                          {label}
                          <span className="text-[10px] opacity-60">{sortIndicator(key)}</span>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {sortedMovers.map((m, i) => (
                    <tr
                      key={m.symbol}
                      className="hover:bg-white/5 cursor-pointer"
                      onClick={() => {
                        setDraft(m.symbol);
                        setSymbol(m.symbol);
                        setView("24h");
                      }}
                    >
                      <td className="px-4 py-3 text-white/40 tabular-nums">
                        {m.rank ?? i + 1}
                      </td>
                      <td className="px-4 py-3 font-semibold">{m.symbol}</td>
                      <td className="px-4 py-3 text-white/60 max-w-[10rem] truncate">
                        {m.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 tabular-nums font-medium">{formatPrice(m.price)}</td>
                      <td className={`px-4 py-3 tabular-nums ${pctColor(m.dailyChange)}`}>
                        {formatPct(m.dailyChange)}
                      </td>
                      <td className={`px-4 py-3 tabular-nums ${pctColor(m.weeklyChange)}`}>
                        {formatPct(m.weeklyChange)}
                      </td>
                      <td className={`px-4 py-3 tabular-nums ${pctColor(m.monthlyChange)}`}>
                        {formatPct(m.monthlyChange)}
                      </td>
                      <td className="px-4 py-3">
                        <SentimentBadge score={m.h24Score} />
                      </td>
                      <td className="px-4 py-3">
                        <SentimentBadge score={m.weekScore} />
                      </td>
                      <td className="px-4 py-3">
                        <SentimentBadge score={m.monthScore} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold tabular-nums ${scoreTextColor(m.velocity)}`}>
                          {formatSentimentScore(m.velocity)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/60">
                        {m.weekMentions}
                        <span className="text-white/35"> (social)</span>
                      </td>
                      <td className="px-4 py-3 text-white/70">{directionLabel(m)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-white/40">
              Click a column header to sort. Click a row to drill into that ticker&apos;s 24h view.
            </p>
          </div>
        )}

        {warnings.length > 0 && view !== "recommendations" && (
          <div className="mt-8 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 space-y-1">
            {warnings.map((w) => (
              <p key={w}>{w}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
