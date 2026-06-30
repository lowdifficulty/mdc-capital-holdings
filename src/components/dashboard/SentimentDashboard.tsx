"use client";

import { useCallback, useEffect, useMemo, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SentimentSourceMatrix from "@/components/dashboard/SentimentSourceMatrix";
import MoverExpandPanel from "@/components/dashboard/MoverExpandPanel";
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

type DashboardView = SentimentPeriod | "movers";

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

function SentimentBadge({
  score,
  large,
  compact,
}: {
  score: number;
  large?: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={`inline-flex rounded border font-semibold tabular-nums ${scoreColor(score)} ${
        large
          ? "px-4 py-2 text-2xl"
          : compact
            ? "px-1 py-0 text-[10px] leading-5"
            : "px-2 py-0.5 text-xs"
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

function directionShort(m: SentimentMover): string {
  if (m.direction === "heating_up") return "↑";
  if (m.direction === "cooling_down") return "↓";
  return "—";
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
  const [view, setView] = useState<DashboardView>("movers");
  const [symbol, setSymbol] = useState("AAPL");
  const [draft, setDraft] = useState("AAPL");
  const [report, setReport] = useState<SentimentReport | null>(null);
  const [movers, setMovers] = useState<MoversReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [moverSortKey, setMoverSortKey] = useState<MoverSortKey>("velocity");
  const [moverSortDir, setMoverSortDir] = useState<SortDir>("desc");
  const [watchlist, setWatchlist] = useState<string[]>([]);

  const sortedMovers = useMemo(() => {
    if (!movers) return [];
    return sortMovers(movers.movers, moverSortKey, moverSortDir);
  }, [movers, moverSortKey, moverSortDir]);

  const watchingMovers = useMemo(() => {
    if (!movers) return [];
    const set = new Set(watchlist);
    return movers.movers.filter((m) => set.has(m.symbol));
  }, [movers, watchlist]);

  const watchingOnlySymbols = useMemo(() => {
    if (!movers) return watchlist;
    const inMovers = new Set(movers.movers.map((m) => m.symbol));
    return watchlist.filter((s) => !inMovers.has(s));
  }, [movers, watchlist]);

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

  const loadWatchlist = useCallback(async () => {
    try {
      const res = await fetch("/api/watchlist");
      if (!res.ok) return;
      const data = (await res.json()) as { watchlist?: string[] };
      setWatchlist(data.watchlist ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  async function addToWatching(symbol: string) {
    const sym = symbol.toUpperCase();
    if (watchlist.includes(sym)) return;
    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol: sym }),
    });
    if (res.ok) {
      const data = (await res.json()) as { watchlist: string[] };
      setWatchlist(data.watchlist);
    }
  }

  async function removeFromWatching(symbol: string) {
    const res = await fetch(`/api/watchlist?symbol=${encodeURIComponent(symbol)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      const data = (await res.json()) as { watchlist: string[] };
      setWatchlist(data.watchlist);
    }
  }

  function toggleWatching(symbol: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (watchlist.includes(symbol.toUpperCase())) void removeFromWatching(symbol);
    else void addToWatching(symbol);
  }

  function toggleMoverExpand(m: SentimentMover) {
    setExpandedSymbol((prev) => (prev === m.symbol ? null : m.symbol));
  }

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

  useEffect(() => {
    void loadSentimentData();
  }, [loadSentimentData]);

  useEffect(() => {
    void loadWatchlist();
  }, [loadWatchlist]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => void loadSentimentData(true), POLL_MS);
    return () => window.clearInterval(id);
  }, [autoRefresh, loadSentimentData]);

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
              <p className="text-xs text-white/50">Movers · 24 hr · Week · Month</p>
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

        {view !== "movers" && (
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

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        {loading && !report && !movers && (
          <p className="mt-12 text-center text-white/50">
            {loadingPeriodLabel(view)}
          </p>
        )}

        {report && view !== "movers" && (
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
            {(watchlist.length > 0 || watchingMovers.length > 0) && (
              <section className="rounded-2xl border border-mdc-blue/30 bg-mdc-blue/10 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h2 className="text-sm font-semibold text-white">
                    Watching
                    <span className="ml-2 text-xs font-normal text-white/50">
                      Stocks you&apos;re planning to buy
                    </span>
                  </h2>
                  <span className="text-xs text-white/40 tabular-nums">{watchlist.length}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {watchingMovers.map((m) => (
                    <div
                      key={m.symbol}
                      className="inline-flex items-center gap-2 rounded-full border border-mdc-blue/40 bg-navy/60 pl-3 pr-1.5 py-1.5 text-sm"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setDraft(m.symbol);
                          setSymbol(m.symbol);
                          setView("24h");
                        }}
                        className="font-semibold hover:text-mdc-blue"
                      >
                        {m.symbol}
                      </button>
                      <span className="text-xs tabular-nums text-white/50">{formatPrice(m.price)}</span>
                      <span className={`text-xs tabular-nums ${pctColor(m.dailyChange)}`}>
                        {formatPct(m.dailyChange)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${m.symbol} from Watching`}
                        onClick={(e) => toggleWatching(m.symbol, e)}
                        className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {watchingOnlySymbols.map((sym) => (
                    <div
                      key={sym}
                      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-navy/60 pl-3 pr-1.5 py-1.5 text-sm"
                    >
                      <span className="font-semibold">{sym}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${sym} from Watching`}
                        onClick={(e) => toggleWatching(sym, e)}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-white/45">
                {movers.totalAnalyzed} stocks analyzed · Updated{" "}
                {lastRefresh ? formatTime(lastRefresh.toISOString()) : "—"}
              </p>
            </div>
            <div className="overflow-y-auto overflow-x-hidden max-h-[70vh] rounded-2xl border border-white/10">
              <table className="w-full table-fixed text-xs">
                <colgroup>
                  <col className="w-[3%]" />
                  <col className="w-[8%]" />
                  <col className="w-[7%]" />
                  <col className="w-[6%]" />
                  <col className="w-[6%]" />
                  <col className="w-[6%]" />
                  <col className="w-[8%]" />
                  <col className="w-[8%]" />
                  <col className="w-[8%]" />
                  <col className="w-[7%]" />
                  <col className="w-[5%]" />
                  <col className="w-[5%]" />
                  <col className="w-[5%]" />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-navy/95 text-left text-[10px] uppercase tracking-wide text-white/50 backdrop-blur">
                  <tr>
                    {(
                      [
                        ["rank", "#"],
                        ["symbol", "Sym"],
                        ["price", "$"],
                        ["dailyChange", "Day"],
                        ["weeklyChange", "Wk"],
                        ["monthlyChange", "Mo"],
                        ["h24Score", "24h"],
                        ["weekScore", "7d"],
                        ["monthScore", "30d"],
                        ["velocity", "Vel"],
                        ["mentions", "Mnt"],
                        ["signal", "Sig"],
                      ] as const
                    ).map(([key, label]) => (
                      <th key={key} className="px-1.5 py-2">
                        <button
                          type="button"
                          onClick={() => handleMoverSort(key)}
                          className={`inline-flex items-center gap-0.5 transition hover:text-white ${
                            moverSortKey === key ? "text-white" : ""
                          }`}
                        >
                          {label}
                          <span className="opacity-50">{sortIndicator(key)}</span>
                        </button>
                      </th>
                    ))}
                    <th className="sticky right-0 z-20 bg-navy/95 px-1 py-2 text-center backdrop-blur">
                      +
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {sortedMovers.map((m, i) => {
                    const isExpanded = expandedSymbol === m.symbol;
                    return (
                      <Fragment key={m.symbol}>
                        <tr
                          className={`hover:bg-white/5 cursor-pointer ${isExpanded ? "bg-white/5" : ""}`}
                          onClick={() => toggleMoverExpand(m)}
                        >
                          <td className="px-1.5 py-2 text-white/40 tabular-nums">
                            {m.rank ?? i + 1}
                          </td>
                          <td
                            className="px-1.5 py-2 font-semibold truncate"
                            title={m.name}
                          >
                            <span className="inline-flex items-center gap-1 min-w-0">
                              <span className="shrink-0 text-white/35 text-[10px]">
                                {isExpanded ? "▼" : "▶"}
                              </span>
                              <span className="truncate">{m.symbol}</span>
                            </span>
                          </td>
                      <td className="px-1.5 py-2 tabular-nums font-medium truncate">
                        {formatPrice(m.price)}
                      </td>
                      <td className={`px-1.5 py-2 tabular-nums truncate ${pctColor(m.dailyChange)}`}>
                        {formatPct(m.dailyChange)}
                      </td>
                      <td className={`px-1.5 py-2 tabular-nums truncate ${pctColor(m.weeklyChange)}`}>
                        {formatPct(m.weeklyChange)}
                      </td>
                      <td className={`px-1.5 py-2 tabular-nums truncate ${pctColor(m.monthlyChange)}`}>
                        {formatPct(m.monthlyChange)}
                      </td>
                      <td className="px-1.5 py-2">
                        <SentimentBadge score={m.h24Score} compact />
                      </td>
                      <td className="px-1.5 py-2">
                        <SentimentBadge score={m.weekScore} compact />
                      </td>
                      <td className="px-1.5 py-2">
                        <SentimentBadge score={m.monthScore} compact />
                      </td>
                      <td className="px-1.5 py-2">
                        <span className={`font-semibold tabular-nums text-[10px] ${scoreTextColor(m.velocity)}`}>
                          {formatSentimentScore(m.velocity)}
                        </span>
                      </td>
                      <td className="px-1.5 py-2 tabular-nums text-white/55">
                        {m.weekMentions}
                      </td>
                      <td
                        className="px-1.5 py-2 text-center text-white/70"
                        title={
                          m.direction === "heating_up"
                            ? "Heating up"
                            : m.direction === "cooling_down"
                              ? "Cooling down"
                              : "Stable"
                        }
                      >
                        {directionShort(m)}
                      </td>
                      <td className="sticky right-0 z-10 bg-navy/90 px-1 py-2 text-center backdrop-blur">
                        <button
                          type="button"
                          aria-label={
                            watchlist.includes(m.symbol)
                              ? `Remove ${m.symbol} from Watching`
                              : `Add ${m.symbol} to Watching`
                          }
                          onClick={(e) => toggleWatching(m.symbol, e)}
                          className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full border text-sm font-bold transition ${
                            watchlist.includes(m.symbol)
                              ? "border-mdc-blue bg-mdc-blue/20 text-mdc-blue"
                              : "border-white/20 text-white/50 hover:border-mdc-blue hover:text-mdc-blue"
                          }`}
                        >
                          {watchlist.includes(m.symbol) ? "✓" : "+"}
                        </button>
                      </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${m.symbol}-detail`}>
                            <td colSpan={13} className="p-0 max-w-0 w-full">
                              <MoverExpandPanel
                                mover={m}
                                onOpenSentiment={() => {
                                  setDraft(m.symbol);
                                  setSymbol(m.symbol);
                                  setView("24h");
                                  setExpandedSymbol(null);
                                }}
                              />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-white/40">
              Click a column header to sort. Click a row to expand the live price chart.
              Use <span className="text-white/60">+</span> to add stocks to Watching.
            </p>
          </div>
        )}

        {warnings.length > 0 && (
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
