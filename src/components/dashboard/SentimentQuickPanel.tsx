"use client";

import { useEffect, useState } from "react";
import type { SentimentReport } from "@/lib/sentiment/types";
import {
  formatSentimentScore,
  scoreColor,
} from "@/components/dashboard/sentimentDisplay";

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

export default function SentimentQuickPanel({
  symbol,
  onOpenSentiment,
  scores,
}: {
  symbol: string;
  onOpenSentiment: () => void;
  scores?: { h24: number; week: number; month: number };
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [h24Report, setH24Report] = useState<SentimentReport | null>(null);
  const [periodScores, setPeriodScores] = useState(scores ?? null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const h24Res = await fetch(
          `/api/sentiment?symbol=${encodeURIComponent(symbol)}&period=24h`,
          { credentials: "same-origin" }
        );
        if (!h24Res.ok) throw new Error("Failed to load sentiment");
        const h24 = (await h24Res.json()) as SentimentReport;
        if (cancelled) return;

        setH24Report(h24);

        if (scores) {
          setPeriodScores(scores);
        } else {
          const [weekRes, monthRes] = await Promise.all([
            fetch(`/api/sentiment?symbol=${encodeURIComponent(symbol)}&period=week`, {
              credentials: "same-origin",
            }),
            fetch(`/api/sentiment?symbol=${encodeURIComponent(symbol)}&period=month`, {
              credentials: "same-origin",
            }),
          ]);
          if (cancelled) return;
          const week = weekRes.ok ? ((await weekRes.json()) as SentimentReport) : null;
          const month = monthRes.ok ? ((await monthRes.json()) as SentimentReport) : null;
          setPeriodScores({
            h24: h24.overallScore,
            week: week?.overallScore ?? 0,
            month: month?.overallScore ?? 0,
          });
        }
      } catch {
        if (!cancelled) setError("Could not load sentiment.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [symbol, scores]);

  const topSources = h24Report?.sources.slice(0, 4) ?? [];

  return (
    <div className="border-t border-mdc-blue/20 bg-navy/80 px-3 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/45">Sentiment</p>
        <button
          type="button"
          onClick={onOpenSentiment}
          className="text-sm text-mdc-blue hover:text-white"
        >
          Full sentiment analysis →
        </button>
      </div>

      {loading && (
        <p className="mt-3 text-sm text-white/45">Loading sentiment for {symbol}…</p>
      )}
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

      {!loading && !error && periodScores && (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            <SentimentPill label="24 hr" score={periodScores.h24} />
            <SentimentPill label="Week" score={periodScores.week} />
            <SentimentPill label="Month" score={periodScores.month} />
          </div>

          {h24Report && (
            <div className="mt-3 space-y-2 text-xs text-white/55">
              <p>
                {h24Report.mentionCount} mentions in the last 24 hours · overall{" "}
                <span className={`font-semibold tabular-nums ${scoreColor(h24Report.overallScore)}`}>
                  {formatSentimentScore(h24Report.overallScore)}
                </span>
              </p>
              {topSources.length > 0 && (
                <ul className="space-y-1">
                  {topSources.map((s) => (
                    <li key={s.source} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-white/45 truncate">{s.label}</span>
                      <span
                        className={`shrink-0 rounded border px-1.5 py-0.5 font-semibold tabular-nums ${scoreColor(s.averageScore)}`}
                      >
                        {formatSentimentScore(s.averageScore)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
