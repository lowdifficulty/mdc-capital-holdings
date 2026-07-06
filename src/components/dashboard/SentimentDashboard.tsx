"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SentimentSourceMatrix from "@/components/dashboard/SentimentSourceMatrix";
import MoverExpandPanel from "@/components/dashboard/MoverExpandPanel";
import MoversMobileList from "@/components/dashboard/MoversMobileList";
import PositionsPanel from "@/components/dashboard/PositionsPanel";
import QuiverAnalysisPanel from "@/components/dashboard/QuiverAnalysisPanel";
import PeptideCalendarPanel from "@/components/dashboard/PeptideCalendarPanel";
import FamilyPanel from "@/components/dashboard/FamilyPanel";
import CommunityPanel from "@/components/dashboard/CommunityPanel";
import { AlfredVoicePanel } from "@/components/dashboard/AlfredVoicePanel";
import {
  formatSentimentScore,
  formatMentions,
  isSecondPlaceMover,
  isWinnerMover,
  scoreColor,
  scoreTextColor,
} from "@/components/dashboard/sentimentDisplay";
import type {
  MoversReport,
  SentimentMover,
  SentimentPeriod,
  SentimentReport,
} from "@/lib/sentiment/types";
import { readMoversCache, writeMoversCache, clearMoversCache } from "@/lib/dashboard/moversCache";
import { useQuiverSync } from "@/hooks/useQuiverSync";
import { useWellnessSync } from "@/hooks/useWellnessSync";

const POLL_MS = 60_000;
const POPULAR_TICKERS = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL"];

type BlankTab = "romance" | "purpose";

type MainTab = "health" | "finance" | "family" | "community" | BlankTab;
type FinanceView = SentimentPeriod | "movers" | "positions" | "quiver";
type DashboardView = "peptides" | "family" | "community" | BlankTab | FinanceView;

const BLANK_TABS: readonly BlankTab[] = ["romance", "purpose"];

const MAIN_TABS: ReadonlyArray<[MainTab, string]> = [
  ["health", "Health"],
  ["finance", "Finance"],
  ["family", "Family"],
  ["community", "Community"],
  ["romance", "Romance"],
  ["purpose", "Purpose"],
];

function dashboardViewForTab(tab: MainTab, financeView: FinanceView): DashboardView {
  if (tab === "finance") return financeView;
  if (tab === "health") return "peptides";
  if (tab === "family") return "family";
  if (tab === "community") return "community";
  return tab;
}

function isPersonalDashboardView(view: DashboardView): boolean {
  if (view === "peptides" || view === "family" || view === "community") return true;
  return (BLANK_TABS as readonly string[]).includes(view);
}

function isSentimentPeriod(view: DashboardView): view is SentimentPeriod {
  return view === "24h" || view === "week" || view === "month";
}

const FINANCE_TABS: ReadonlyArray<[FinanceView, string]> = [
  ["positions", "My Positions"],
  ["quiver", "QuiverQuant"],
  ["movers", "Movers"],
  ["24h", "24 hr"],
  ["week", "Week"],
  ["month", "Month"],
];

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
  if (view === "positions") return "Loading your positions…";
  if (view === "quiver") return "Loading Quiver analysis…";
  if (view === "movers") return "Loading all tracked stocks…";
  if (view === "24h") return "Analyzing 24 hr sentiment…";
  if (view === "week") return "Analyzing 7-day sentiment…";
  return "Analyzing 30-day sentiment…";
}

type MoverFilter = "all" | "winners" | "second";

const MOVER_FILTER_BUTTONS: Array<{
  id: Exclude<MoverFilter, "all">;
  label: string;
  title: string;
  activeClass: string;
  hoverClass: string;
}> = [
  {
    id: "winners",
    label: "Winners",
    title: "All six analysis columns green (Day, Wk, Mo, 24h, 7d, 30d)",
    activeClass: "bg-emerald-500/20 border-emerald-400/40 text-emerald-300",
    hoverClass: "hover:border-emerald-400/40 hover:text-emerald-300",
  },
  {
    id: "second",
    label: "Second Place",
    title: "Five of six analysis columns green",
    activeClass: "bg-teal-500/20 border-teal-400/40 text-teal-300",
    hoverClass: "hover:border-teal-400/40 hover:text-teal-300",
  },
];

function moverFilterEmptyMessage(filter: Exclude<MoverFilter, "all">): string {
  switch (filter) {
    case "winners":
      return "No stocks have all six analysis columns green right now (Day, Wk, Mo, 24h, 7d, 30d).";
    case "second":
      return "No stocks have exactly five of six analysis columns green right now.";
  }
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

function reportCacheKey(symbol: string, period: SentimentPeriod): string {
  return `${symbol.toUpperCase()}:${period}`;
}

export default function SentimentDashboard() {
  const router = useRouter();
  const { refreshToken: wellnessSyncToken } = useWellnessSync();
  const [mainTab, setMainTab] = useState<MainTab>("health");
  const [financeView, setFinanceView] = useState<FinanceView>("positions");
  const view: DashboardView = dashboardViewForTab(mainTab, financeView);

  function openFinanceView(next: FinanceView) {
    setMainTab("finance");
    setFinanceView(next);
  }
  const [symbol, setSymbol] = useState("AAPL");
  const [draft, setDraft] = useState("AAPL");
  const [report, setReport] = useState<SentimentReport | null>(null);
  const [movers, setMovers] = useState<MoversReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [cacheReady, setCacheReady] = useState(false);
  const moversRef = useRef<MoversReport | null>(null);
  const reportCacheRef = useRef<Record<string, SentimentReport>>({});
  const dashboardRootRef = useRef<HTMLDivElement>(null);
  const dashboardMenuRef = useRef<HTMLDivElement>(null);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [moverSortKey, setMoverSortKey] = useState<MoverSortKey>("velocity");
  const [moverSortDir, setMoverSortDir] = useState<SortDir>("desc");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [positionSymbols, setPositionSymbols] = useState<string[]>([]);
  const [moverFilter, setMoverFilter] = useState<MoverFilter>("all");
  const { syncing: quiverSyncing, startSync: startQuiverSync, refreshToken: quiverRefreshToken, syncError: quiverSyncError } =
    useQuiverSync();

  useEffect(() => {
    moversRef.current = movers;
  }, [movers]);

  useEffect(() => {
    const menu = dashboardMenuRef.current;
    const root = dashboardRootRef.current;
    if (!menu || !root) return;

    const updateMenuHeight = () => {
      const isMobile = window.matchMedia("(max-width: 639px)").matches;
      const height = isMobile ? `${menu.offsetHeight}px` : "0px";
      root.style.setProperty("--dashboard-menu-h", height);
      document.documentElement.style.setProperty("--dashboard-menu-h", height);
    };

    updateMenuHeight();
    const observer = new ResizeObserver(updateMenuHeight);
    observer.observe(menu);
    window.addEventListener("resize", updateMenuHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateMenuHeight);
      document.documentElement.style.removeProperty("--dashboard-menu-h");
    };
  }, []);

  useEffect(() => {
    const cached = readMoversCache();
    if (cached) {
      setMovers(cached);
      moversRef.current = cached;
      setLastRefresh(new Date(cached.analyzedAt));
      setLoading(false);
    }
    setCacheReady(true);
  }, []);

  const filteredMovers = useMemo(() => {
    if (!movers) return [];
    switch (moverFilter) {
      case "winners":
        return movers.movers.filter(isWinnerMover);
      case "second":
        return movers.movers.filter(isSecondPlaceMover);
      default:
        return movers.movers;
    }
  }, [movers, moverFilter]);

  const sortedMovers = useMemo(
    () => sortMovers(filteredMovers, moverSortKey, moverSortDir),
    [filteredMovers, moverSortKey, moverSortDir]
  );

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
      const res = await fetch("/api/watchlist", { credentials: "same-origin" });
      if (!res.ok) return;
      const data = (await res.json()) as { watchlist?: string[] };
      setWatchlist((data.watchlist ?? []).map((s) => s.toUpperCase()));
    } catch {
      /* ignore */
    }
  }, []);

  async function addToWatching(symbol: string) {
    const sym = symbol.toUpperCase();
    if (watchlist.includes(sym)) return;
    const prev = watchlist;
    setWatchlist([...prev, sym]);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: sym }),
      });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { watchlist: string[] };
      setWatchlist(data.watchlist.map((s) => s.toUpperCase()));
    } catch {
      setWatchlist(prev);
    }
  }

  async function removeFromWatching(symbol: string) {
    const sym = symbol.toUpperCase();
    const prev = watchlist;
    setWatchlist(prev.filter((s) => s !== sym));
    try {
      const res = await fetch(`/api/watchlist?symbol=${encodeURIComponent(sym)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { watchlist: string[] };
      setWatchlist(data.watchlist.map((s) => s.toUpperCase()));
    } catch {
      setWatchlist(prev);
    }
  }

  function toggleWatching(symbol: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const sym = symbol.toUpperCase();
    if (watchlist.includes(sym)) void removeFromWatching(sym);
    else void addToWatching(sym);
  }

  const loadPositionSymbols = useCallback(async () => {
    try {
      const res = await fetch("/api/positions", { credentials: "same-origin" });
      if (!res.ok) return;
      const data = (await res.json()) as { positions?: Array<{ symbol: string }> };
      setPositionSymbols((data.positions ?? []).map((p) => p.symbol.toUpperCase()));
    } catch {
      /* ignore */
    }
  }, []);

  async function addToPositions(symbol: string, e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    const sym = symbol.toUpperCase();
    if (positionSymbols.includes(sym)) return;
    const prev = positionSymbols;
    setPositionSymbols([...prev, sym]);
    try {
      const res = await fetch("/api/positions", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: sym }),
      });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { positions: Array<{ symbol: string }> };
      setPositionSymbols(data.positions.map((p) => p.symbol.toUpperCase()));
    } catch {
      setPositionSymbols(prev);
    }
  }

  function toggleMoverExpand(m: SentimentMover) {
    setExpandedSymbol((prev) => (prev === m.symbol ? null : m.symbol));
  }

  const loadDashboardData = useCallback(
    async (opts?: { force?: boolean; silent?: boolean }) => {
      const force = opts?.force ?? false;
      const silent = opts?.silent ?? false;

      try {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        if (!session.user) {
          router.replace("/login");
          return;
        }

        if (view === "movers") {
          if (!force && moversRef.current) {
            if (!silent) setLoading(false);
            return;
          }

          if (force && moversRef.current) setRefreshing(true);
          else if (!silent) setLoading(true);
          setError("");

          const res = await fetch("/api/sentiment?view=movers");
          if (res.status === 401) {
            router.replace("/login");
            return;
          }
          if (!res.ok) throw new Error("Failed to load movers");
          const data = (await res.json()) as MoversReport;
          setMovers(data);
          moversRef.current = data;
          writeMoversCache(data);
          setLastRefresh(new Date(data.analyzedAt));
          return;
        }

        if (view === "positions" || view === "quiver" || isPersonalDashboardView(view)) {
          if (!silent) setLoading(false);
          return;
        }

        if (!isSentimentPeriod(view)) {
          if (!silent) setLoading(false);
          return;
        }

        const cacheKey = reportCacheKey(symbol, view);
        const cachedReport = reportCacheRef.current[cacheKey];
        if (!force && cachedReport) {
          setReport(cachedReport);
          if (!silent) setLoading(false);
          return;
        }

        if (!silent) setLoading(true);
        setError("");

        const res = await fetch(
          `/api/sentiment?symbol=${encodeURIComponent(symbol)}&period=${view}`
        );
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (!res.ok) throw new Error("Failed to load sentiment");
        const data = (await res.json()) as SentimentReport;
        reportCacheRef.current[cacheKey] = data;
        setReport(data);
        setLastRefresh(new Date());
      } catch {
        setError("Could not load sentiment data. Try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router, symbol, view]
  );

  useEffect(() => {
    if (!cacheReady) return;
    void loadDashboardData();
  }, [cacheReady, loadDashboardData]);

  useEffect(() => {
    if (!isPersonalDashboardView(view) && view !== "movers" && view !== "positions" && view !== "quiver") setMoverFilter("all");
  }, [view]);

  useEffect(() => {
    void loadWatchlist();
    void loadPositionSymbols();
  }, [loadWatchlist, loadPositionSymbols]);

  useEffect(() => {
    if (!autoRefresh || view === "movers" || view === "positions" || view === "quiver" || isPersonalDashboardView(view)) return;
    const id = window.setInterval(
      () => void loadDashboardData({ force: true, silent: true }),
      POLL_MS
    );
    return () => window.clearInterval(id);
  }, [autoRefresh, view, loadDashboardData]);

  async function refreshMovers() {
    await loadDashboardData({ force: true });
  }

  async function handleLogout() {
    clearMoversCache();
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    const next = draft.trim().toUpperCase();
    if (!next) return;
    setSymbol(next);
    if (view === "movers") openFinanceView("24h");
  }

  const warnings = report?.warnings ?? movers?.warnings ?? [];

  return (
    <div
      ref={dashboardRootRef}
      className="dashboard-wayne relative min-h-screen text-[#eae6dc] [--dashboard-menu-h:0px]"
    >
      <div className="pointer-events-none fixed inset-0 dashboard-wayne-texture" aria-hidden />
      <div className="pointer-events-none fixed inset-0 dashboard-wayne-gold-wash" aria-hidden />

      <div
        ref={dashboardMenuRef}
        className="sticky top-0 z-[60] bg-[#050505]/95 backdrop-blur-md"
      >
        <header className="border-b border-[#c9a227]/15">
          <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Link
                href="/"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#c9a227] text-xs font-bold text-[#050505]"
              >
                MDC
              </Link>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium uppercase tracking-[0.2em] text-[#c9a227]/80">
                  Command center
                </p>
                <p className="truncate font-serif text-sm text-[#f8f4ec] sm:text-base">
                  Operations Dashboard
                </p>
                <p className="hidden truncate text-xs text-[#eae6dc]/45 lg:block">
                  Health · Finance · Family · Community · Romance · Purpose
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="shrink-0 rounded-sm border border-[#c9a227]/35 px-3 py-1.5 text-sm uppercase tracking-wide text-[#eae6dc]/70 transition-colors hover:border-[#c9a227] hover:text-[#c9a227]"
            >
              Sign out
            </button>
          </div>
        </header>

        <div className="border-b border-[#c9a227]/10 sm:hidden">
          <div className="-mx-0 flex gap-2 overflow-x-auto px-3 py-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {MAIN_TABS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMainTab(key)}
                className={`touch-manipulation min-h-[44px] shrink-0 rounded-sm px-3 py-2.5 text-sm font-bold uppercase tracking-wide transition active:opacity-90 sm:min-h-0 sm:px-4 sm:py-3 sm:text-base ${
                  mainTab === key
                    ? "bg-[#c9a227] text-[#050505] shadow-lg shadow-[#c9a227]/20"
                    : "border border-[#c9a227]/20 text-[#eae6dc]/65 hover:border-[#c9a227]/40 hover:text-[#c9a227]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
        <div className="hidden gap-2 sm:flex sm:flex-wrap">
          {MAIN_TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMainTab(key)}
              className={`touch-manipulation min-h-[44px] shrink-0 rounded-sm px-3 py-2.5 text-sm font-bold uppercase tracking-wide transition active:opacity-90 sm:min-h-0 sm:px-4 sm:py-3 sm:text-base ${
                mainTab === key
                  ? "bg-[#c9a227] text-[#050505] shadow-lg shadow-[#c9a227]/20"
                  : "border border-[#c9a227]/20 text-[#eae6dc]/65 hover:border-[#c9a227]/40 hover:text-[#c9a227]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mainTab === "finance" && (
          <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto border-b border-white/10 px-4 pb-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {FINANCE_TABS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFinanceView(key)}
                className={`shrink-0 rounded-sm px-4 py-2 text-sm font-semibold uppercase tracking-wide transition sm:px-5 ${
                  financeView === key
                    ? "bg-[#c9a227]/15 text-[#f8f4ec] ring-1 ring-[#c9a227]/30"
                    : "border border-[#c9a227]/20 text-[#eae6dc]/65 hover:border-[#c9a227]/40"
                }`}
              >
                {label}
                {key === "quiver" && quiverSyncing && (
                  <span className="ml-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                )}
              </button>
            ))}
          </div>
        )}

        {quiverSyncing && mainTab === "finance" && view !== "quiver" && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-200">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Quiver data sync in progress — you can keep browsing other tabs.
          </div>
        )}

        {!isPersonalDashboardView(view) && view !== "movers" && view !== "positions" && view !== "quiver" && (
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
                className="w-full max-w-xs rounded-sm border border-[#c9a227]/20 bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/25"
                  placeholder="AAPL"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="rounded-sm bg-[#c9a227] px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-[#050505] hover:bg-[#e0c56a] disabled:opacity-50"
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

        {mainTab === "finance" && financeView === "positions" && (
          <PositionsPanel
            onPositionsChange={setPositionSymbols}
            onOpenSentiment={(sym) => {
              setDraft(sym);
              setSymbol(sym);
              openFinanceView("24h");
              setExpandedSymbol(null);
            }}
          />
        )}

        {mainTab === "health" && (
          <div className="max-w-3xl sm:max-w-none">
            <PeptideCalendarPanel syncToken={wellnessSyncToken} />
          </div>
        )}

        <div className={mainTab === "family" ? undefined : "hidden"} aria-hidden={mainTab !== "family"}>
          <FamilyPanel />
        </div>

        <div className={mainTab === "community" ? undefined : "hidden"} aria-hidden={mainTab !== "community"}>
          <CommunityPanel />
        </div>

        {BLANK_TABS.map((tab) => (
          <div
            key={tab}
            className={mainTab === tab ? undefined : "hidden"}
            aria-hidden={mainTab !== tab}
          >
            <div className="mt-6 min-h-[50vh] rounded-sm border border-[#c9a227]/12 bg-black/20" />
          </div>
        ))}

        <div className={mainTab === "finance" && financeView === "quiver" ? undefined : "hidden"} aria-hidden={!(mainTab === "finance" && financeView === "quiver")}>
          <QuiverAnalysisPanel
            syncing={quiverSyncing}
            syncError={quiverSyncError}
            refreshToken={quiverRefreshToken}
            onStartSync={startQuiverSync}
          />
        </div>

        {view === "movers" && (
          <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
            <p className="text-sm text-white/55 max-w-2xl">
              All tracked tickers from ApeWisdom (Reddit) and SwaggyStocks (WSB), ranked by
              sentiment velocity and mention momentum. Click a row for full multi-source analysis.
            </p>
            <div className="flex flex-wrap gap-2 shrink-0">
              {MOVER_FILTER_BUTTONS.map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  title={btn.title}
                  onClick={() =>
                    setMoverFilter((current) => (current === btn.id ? "all" : btn.id))
                  }
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition border ${
                    moverFilter === btn.id
                      ? btn.activeClass
                      : `border-white/15 text-white/70 ${btn.hoverClass}`
                  }`}
                >
                  {btn.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => void refreshMovers()}
                disabled={refreshing}
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-mdc-blue hover:text-white disabled:opacity-50"
              >
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        {loading && !report && !movers && view !== "positions" && view !== "quiver" && !isPersonalDashboardView(view) && (
          <p className="mt-12 text-center text-white/50">
            {loadingPeriodLabel(view)}
          </p>
        )}

        {report && view !== "movers" && view !== "positions" && view !== "quiver" && !isPersonalDashboardView(view) && (
          <div className="mt-6 space-y-6 sm:mt-8 sm:space-y-8">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 lg:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                  {periodTitle(report.period)}
                </p>
                <p className="mt-2 font-serif text-3xl sm:mt-3 sm:text-4xl">{report.symbol}</p>
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

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 lg:col-span-2">
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
                          openFinanceView("24h");
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
                        aria-label={
                          positionSymbols.includes(m.symbol)
                            ? `${m.symbol} is in your positions`
                            : `Add ${m.symbol} to positions`
                        }
                        onClick={(e) => void addToPositions(m.symbol, e)}
                        disabled={positionSymbols.includes(m.symbol)}
                        className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold transition ${
                          positionSymbols.includes(m.symbol)
                            ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                            : "border-white/25 text-white/60 hover:border-emerald-400 hover:text-emerald-300"
                        }`}
                      >
                        {positionSymbols.includes(m.symbol) ? "✓" : "+"}
                      </button>
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
                        aria-label={
                          positionSymbols.includes(sym)
                            ? `${sym} is in your positions`
                            : `Add ${sym} to positions`
                        }
                        onClick={(e) => void addToPositions(sym, e)}
                        disabled={positionSymbols.includes(sym)}
                        className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold transition ${
                          positionSymbols.includes(sym)
                            ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                            : "border-white/25 text-white/60 hover:border-emerald-400 hover:text-emerald-300"
                        }`}
                      >
                        {positionSymbols.includes(sym) ? "✓" : "+"}
                      </button>
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
                {moverFilter !== "all" ? (
                  <>
                    {sortedMovers.length}{" "}
                    {moverFilter === "winners"
                      ? `winner${sortedMovers.length === 1 ? "" : "s"}`
                      : "second-place"}{" "}
                    of {movers.totalAnalyzed} stocks
                  </>
                ) : (
                  <>{movers.totalAnalyzed} stocks analyzed</>
                )}
                {" · Updated "}
                {lastRefresh ? formatTime(lastRefresh.toISOString()) : "—"}
              </p>
            </div>
            {moverFilter !== "all" && sortedMovers.length === 0 && (
              <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/50">
                {moverFilterEmptyMessage(moverFilter)}
              </p>
            )}
            {sortedMovers.length > 0 && (
            <>
            <MoversMobileList
              movers={sortedMovers}
              expandedSymbol={expandedSymbol}
              watchlist={watchlist}
              onToggleExpand={toggleMoverExpand}
              onToggleWatch={toggleWatching}
              onOpenSentiment={(sym) => {
                setDraft(sym);
                setSymbol(sym);
                openFinanceView("24h");
                setExpandedSymbol(null);
              }}
            />
            <div className="hidden md:block overflow-y-auto overflow-x-hidden md:max-h-[70vh] rounded-2xl border border-white/10">
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
                        {formatMentions(m.weekMentions)}
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
                            watchlist.includes(m.symbol.toUpperCase())
                              ? `Remove ${m.symbol} from Watching`
                              : `Add ${m.symbol} to Watching`
                          }
                          onClick={(e) => toggleWatching(m.symbol, e)}
                          className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full border text-sm font-bold transition ${
                            watchlist.includes(m.symbol.toUpperCase())
                              ? "border-mdc-blue bg-mdc-blue/20 text-mdc-blue"
                              : "border-white/20 text-white/50 hover:border-mdc-blue hover:text-mdc-blue"
                          }`}
                        >
                          {watchlist.includes(m.symbol.toUpperCase()) ? "✓" : "+"}
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
                                  openFinanceView("24h");
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
            </>
            )}
            <p className="text-xs text-white/40">
              <span className="md:hidden">Tap a card to expand the chart. Use </span>
              <span className="hidden md:inline">Click a column header to sort. Click a row to expand the live price chart. Use </span>
              <span className="text-white/60">+</span> to add stocks to Watching. In Watching, use{" "}
              <span className="text-emerald-300/80">+</span> to move a stock into My Positions.
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

      <AlfredVoicePanel />
    </div>
  );
}
