"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { FinalSignal, Recommendation } from "@/lib/intelligence/types";
import {
  formatSignedScore,
  formatUsd,
  signalColor,
  signedScoreColor,
} from "@/components/intelligence/intelligenceDisplay";

export interface RecommendationsPayload {
  analyzedAt: string;
  topRecommendations: Recommendation[];
  all: Recommendation[];
  positiveSentiment: Recommendation[];
  negativeSentiment: Recommendation[];
  bestValueRisk: Recommendation[];
  disclaimer: string;
}

type RecSortKey =
  | "symbol"
  | "signal"
  | "confidence"
  | "sentimentScore"
  | "technicalScore"
  | "momentumScore"
  | "valueToRisk"
  | "price";

type SortDir = "asc" | "desc";

const SIGNAL_ORDER: Record<FinalSignal, number> = {
  "Strong Buy": 5,
  Buy: 4,
  Watch: 3,
  Avoid: 2,
  "Short-Candidate": 1,
};

function compareRec(a: Recommendation, b: Recommendation, key: RecSortKey): number {
  switch (key) {
    case "symbol":
      return a.symbol.localeCompare(b.symbol);
    case "signal":
      return SIGNAL_ORDER[a.signal] - SIGNAL_ORDER[b.signal];
    case "confidence":
      return a.confidence - b.confidence;
    case "sentimentScore":
      return a.sentimentScore - b.sentimentScore;
    case "technicalScore":
      return a.technicalScore - b.technicalScore;
    case "momentumScore":
      return a.momentumScore - b.momentumScore;
    case "valueToRisk":
      return a.valueRisk.valueToRiskRatio - b.valueRisk.valueToRiskRatio;
    case "price":
      return a.price - b.price;
  }
}

export default function RecommendationsTab({
  data,
  loading,
  error,
  onRefresh,
}: {
  data: RecommendationsPayload | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
}) {
  const [sortKey, setSortKey] = useState<RecSortKey>("confidence");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [draft, setDraft] = useState("");

  const sorted = useMemo(() => {
    if (!data) return [];
    const items = [...data.all].sort((a, b) => compareRec(a, b, sortKey));
    return sortDir === "desc" ? items.reverse() : items;
  }, [data, sortKey, sortDir]);

  function handleSort(key: RecSortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "symbol" ? "asc" : "desc");
    }
  }

  function sortIndicator(key: RecSortKey): string {
    if (sortKey !== key) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  }

  function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    const sym = draft.trim().toUpperCase();
    if (!sym) return;
    window.location.href = `/intelligence/${sym}`;
  }

  return (
    <div className="mt-6 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-sm text-white/55 max-w-2xl">
          Algorithmic BUY / WATCH / AVOID signals combining sentiment, technicals, momentum, and
          value-to-risk. Research only — not financial advice.
        </p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium hover:border-mdc-blue hover:text-mdc-blue disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Refresh"}
        </button>
      </div>

      <form onSubmit={handleAnalyze} className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="rec-ticker" className="block text-xs font-medium text-white/60 mb-1.5">
            Analyze ticker
          </label>
          <input
            id="rec-ticker"
            value={draft}
            onChange={(e) => setDraft(e.target.value.toUpperCase())}
            className="w-full max-w-xs rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-mdc-blue focus:ring-2 focus:ring-mdc-blue/30"
            placeholder="NVDA"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-mdc-blue px-6 py-2.5 text-sm font-semibold hover:bg-white hover:text-navy"
        >
          Full analysis
        </button>
        <Link
          href="/intelligence/scanner"
          className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/70 hover:border-white/30"
        >
          Strategy scanner
        </Link>
      </form>

      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading && !data && (
        <p className="py-16 text-center text-white/50">
          Running recommendation engine across tracked universe…
          <br />
          <span className="text-xs text-white/35">This may take up to a minute.</span>
        </p>
      )}

      {data && (
        <>
          <p className="text-xs text-white/40">
            Last analyzed {new Date(data.analyzedAt).toLocaleString()} · {data.all.length} tickers
          </p>

          {data.topRecommendations.length > 0 && (
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/50">
                Top picks — Buy &amp; Strong Buy
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.topRecommendations.map((r) => (
                  <RecCard key={r.symbol} rec={r} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/50">
              All recommendations
            </h2>
            <div className="overflow-auto max-h-[65vh] rounded-2xl border border-white/10">
              <table className="w-full min-w-[1000px] text-sm">
                <thead className="sticky top-0 z-10 bg-navy/95 text-left text-xs uppercase tracking-wide text-white/50 backdrop-blur">
                  <tr>
                    {(
                      [
                        ["symbol", "Ticker"],
                        ["signal", "Signal"],
                        ["confidence", "Score"],
                        ["sentimentScore", "Sentiment"],
                        ["technicalScore", "Technical"],
                        ["momentumScore", "Momentum"],
                        ["valueToRisk", "V/R"],
                        ["price", "Price"],
                      ] as const
                    ).map(([key, label]) => (
                      <th key={key} className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleSort(key)}
                          className={`inline-flex items-center gap-1.5 transition hover:text-white ${
                            sortKey === key ? "text-white" : ""
                          }`}
                        >
                          {label}
                          <span className="text-[10px] opacity-60">{sortIndicator(key)}</span>
                        </button>
                      </th>
                    ))}
                    <th className="px-4 py-3">Strategies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {sorted.map((r) => (
                    <tr key={r.symbol} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-semibold">
                        <Link href={`/intelligence/${r.symbol}`} className="hover:text-mdc-blue">
                          {r.symbol}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded border px-2 py-0.5 text-xs font-semibold ${signalColor(r.signal)}`}
                        >
                          {r.signal}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold tabular-nums">{r.confidence}</td>
                      <td className={`px-4 py-3 tabular-nums ${signedScoreColor(r.sentimentScore)}`}>
                        {formatSignedScore(r.sentimentScore)}
                      </td>
                      <td className={`px-4 py-3 tabular-nums ${signedScoreColor(r.technicalScore)}`}>
                        {formatSignedScore(r.technicalScore)}
                      </td>
                      <td className={`px-4 py-3 tabular-nums ${signedScoreColor(r.momentumScore)}`}>
                        {formatSignedScore(r.momentumScore)}
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-mdc-blue">
                        {r.valueRisk.valueToRiskRatio.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{formatUsd(r.price)}</td>
                      <td className="px-4 py-3 max-w-[14rem] truncate text-xs text-white/50">
                        {r.strategies[0]?.name ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid gap-8 lg:grid-cols-3">
            <section className="lg:col-span-2">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/50">
                Best value-to-risk
              </h2>
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-sm">
                  <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-white/50">
                    <tr>
                      <th className="px-4 py-3 text-left">Ticker</th>
                      <th className="px-4 py-3 text-left">V/R</th>
                      <th className="px-4 py-3 text-left">Stop</th>
                      <th className="px-4 py-3 text-left">Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bestValueRisk.map((r) => (
                      <tr key={r.symbol} className="border-b border-white/5">
                        <td className="px-4 py-3 font-semibold">
                          <Link href={`/intelligence/${r.symbol}`}>{r.symbol}</Link>
                        </td>
                        <td className="px-4 py-3 text-mdc-blue font-semibold">
                          {r.valueRisk.valueToRiskRatio.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-red-300">
                          {formatUsd(r.valueRisk.stopLoss)}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-emerald-300">
                          {formatUsd(r.valueRisk.upsideTarget)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-6">
              <div>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/50">
                  Sentiment rising
                </h2>
                <div className="space-y-2">
                  {data.positiveSentiment.map((r) => (
                    <SentimentChip key={r.symbol} rec={r} positive />
                  ))}
                </div>
              </div>
              <div>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/50">
                  Sentiment falling
                </h2>
                <div className="space-y-2">
                  {data.negativeSentiment.map((r) => (
                    <SentimentChip key={r.symbol} rec={r} />
                  ))}
                </div>
              </div>
            </section>
          </div>

          <p className="border-t border-white/10 pt-6 text-xs text-white/40">{data.disclaimer}</p>
        </>
      )}
    </div>
  );
}

function RecCard({ rec }: { rec: Recommendation }) {
  return (
    <Link
      href={`/intelligence/${rec.symbol}`}
      className="block rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-mdc-blue/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-bold">{rec.symbol}</p>
          <p className="text-xs text-white/50">{formatUsd(rec.price)}</p>
        </div>
        <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${signalColor(rec.signal)}`}>
          {rec.signal}
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{rec.confidence}</p>
      <p className="mt-2 line-clamp-2 text-xs text-white/55">{rec.explanation}</p>
    </Link>
  );
}

function SentimentChip({ rec, positive }: { rec: Recommendation; positive?: boolean }) {
  return (
    <Link
      href={`/intelligence/${rec.symbol}`}
      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:border-mdc-blue/30"
    >
      <span className="font-semibold">{rec.symbol}</span>
      <span className={`tabular-nums font-medium ${positive ? "text-emerald-400" : "text-red-400"}`}>
        {formatSignedScore(rec.sentiment.velocity)}
      </span>
    </Link>
  );
}
