"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SentimentReport, SentimentLabel } from "@/lib/sentiment/types";

const POLL_MS = 45_000;

const POPULAR_TICKERS = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL"];

function labelColor(label: SentimentLabel): string {
  if (label === "bullish") return "text-emerald-400 bg-emerald-400/15 border-emerald-400/30";
  if (label === "bearish") return "text-red-400 bg-red-400/15 border-red-400/30";
  return "text-amber-200 bg-amber-200/10 border-amber-200/20";
}

function scorePercent(score: number): string {
  return `${score >= 0 ? "+" : ""}${(score * 100).toFixed(0)}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SentimentDashboard() {
  const router = useRouter();
  const [symbol, setSymbol] = useState("AAPL");
  const [draft, setDraft] = useState("AAPL");
  const [report, setReport] = useState<SentimentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadReport = useCallback(async (ticker: string, silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      if (!session.user) {
        router.replace("/login");
        return;
      }

      const res = await fetch(`/api/sentiment?symbol=${encodeURIComponent(ticker)}`);
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to load sentiment");
      const data = (await res.json()) as SentimentReport;
      setReport(data);
      setLastRefresh(new Date());
    } catch {
      setError("Could not load sentiment data. Try again.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadReport(symbol);
  }, [symbol, loadReport]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => {
      void loadReport(symbol, true);
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [autoRefresh, symbol, loadReport]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    const next = draft.trim().toUpperCase();
    if (!next) return;
    setSymbol(next);
  }

  return (
    <div className="min-h-screen bg-navy text-white">
      <header className="border-b border-white/10 bg-navy/90 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-md bg-mdc-blue text-xs font-bold">
              MDC
            </Link>
            <div>
              <p className="text-sm font-semibold">Market Sentiment</p>
              <p className="text-xs text-white/50">News &amp; forum analysis</p>
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
        <form onSubmit={handleAnalyze} className="flex flex-wrap items-end gap-3">
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
            Auto-refresh (45s)
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

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        {loading && !report && (
          <p className="mt-12 text-center text-white/50">Analyzing sentiment across sources…</p>
        )}

        {report && (
          <div className="mt-8 space-y-8">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 lg:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                  Overall sentiment
                </p>
                <p className="mt-3 font-serif text-4xl">{report.symbol}</p>
                <div className="mt-4 flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold capitalize ${labelColor(report.overallLabel)}`}
                  >
                    {report.overallLabel}
                  </span>
                  <span className="text-2xl font-semibold tabular-nums">
                    {scorePercent(report.overallScore)}
                  </span>
                </div>
                <p className="mt-4 text-xs text-white/45">
                  {report.mentionCount} mentions · Updated{" "}
                  {lastRefresh ? formatTime(lastRefresh.toISOString()) : "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                  By source
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {report.sources.map((source) => (
                    <div
                      key={source.source}
                      className="rounded-xl border border-white/10 bg-navy/40 px-4 py-3"
                    >
                      <p className="text-sm font-medium">{source.label}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-white/50">
                        <span>{source.count} items</span>
                        <span className={`capitalize font-semibold ${labelColor(source.labelSummary).split(" ")[0]}`}>
                          {source.labelSummary} ({scorePercent(source.averageScore)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {report.warnings.length > 0 && (
              <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                {report.warnings.map((w) => (
                  <p key={w}>{w}</p>
                ))}
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-4">
                Live feed
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
                          <p className="mt-1 text-xs text-white/50 line-clamp-2">{mention.summary}</p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${labelColor(mention.label)}`}
                      >
                        {mention.label}
                      </span>
                    </div>
                    <p className="mt-2 text-[10px] text-white/40 uppercase tracking-wide">
                      {mention.source.replace("_", " ")}
                      {mention.publishedAt ? ` · ${formatTime(mention.publishedAt)}` : ""}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
