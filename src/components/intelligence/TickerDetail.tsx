"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Recommendation } from "@/lib/intelligence/types";
import IntelligenceShell from "./IntelligenceShell";
import {
  WARNING_LABELS,
  formatPct,
  formatSignedScore,
  formatUsd,
  scoreBarColor,
  signalColor,
  signedScoreColor,
} from "./intelligenceDisplay";
import { formatSentimentScore, scoreColor } from "@/components/dashboard/sentimentDisplay";

export default function TickerDetail({ symbol }: { symbol: string }) {
  const router = useRouter();
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [onWatchlist, setOnWatchlist] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      if (!session.user) {
        router.replace("/login");
        return;
      }
      const [recRes, wlRes] = await Promise.all([
        fetch(`/api/recommendations/${symbol}`),
        fetch("/api/watchlist"),
      ]);
      if (recRes.ok) setRec(await recRes.json());
      if (wlRes.ok) {
        const wl = await wlRes.json();
        setOnWatchlist((wl.watchlist ?? []).includes(symbol.toUpperCase()));
      }
    } finally {
      setLoading(false);
    }
  }, [router, symbol]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleWatchlist() {
    if (onWatchlist) {
      await fetch(`/api/watchlist?symbol=${symbol}`, { method: "DELETE" });
      setOnWatchlist(false);
    } else {
      await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      setOnWatchlist(true);
    }
  }

  if (loading) {
    return (
      <IntelligenceShell title={symbol} subtitle="Loading analysis…">
        <p className="text-sm text-white/50">Analyzing {symbol}…</p>
      </IntelligenceShell>
    );
  }

  if (!rec) {
    return (
      <IntelligenceShell title={symbol}>
        <p className="text-sm text-red-300">Could not analyze this ticker.</p>
      </IntelligenceShell>
    );
  }

  const t = rec.technical;

  return (
    <IntelligenceShell title={rec.symbol} subtitle={`${formatUsd(rec.price)} · ${formatPct(rec.dailyChangePct)} today`}>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <span className={`rounded-lg border px-4 py-2 text-lg font-bold ${signalColor(rec.signal)}`}>
          {rec.signal}
        </span>
        <div>
          <p className="text-3xl font-bold tabular-nums">{rec.confidence}</p>
          <p className="text-xs text-white/50">Confidence / 100</p>
        </div>
        <button
          type="button"
          onClick={() => void toggleWatchlist()}
          className="ml-auto rounded-full border border-white/20 px-4 py-2 text-sm hover:border-mdc-blue"
        >
          {onWatchlist ? "On watchlist" : "Add to watchlist"}
        </button>
      </div>

      <p className="mb-8 rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-white/80">
        {rec.explanation}
      </p>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreCard label="Sentiment" score={rec.sentimentScore} />
        <ScoreCard label="Technical" score={rec.technicalScore} />
        <ScoreCard label="Momentum" score={rec.momentumScore} />
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/50">Risk score</p>
          <p className="text-2xl font-bold tabular-nums text-orange-300">{rec.riskScore}</p>
          <p className="text-xs text-white/40">Higher = more caution</p>
        </div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
            Sentiment
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-white/40">24 hr</p>
              <span className={`inline-block rounded border px-2 py-1 text-sm font-semibold ${scoreColor(rec.sentiment.score24h)}`}>
                {formatSentimentScore(rec.sentiment.score24h)}
              </span>
            </div>
            <div>
              <p className="text-xs text-white/40">1 week</p>
              <span className={`inline-block rounded border px-2 py-1 text-sm font-semibold ${scoreColor(rec.sentiment.scoreWeek)}`}>
                {formatSentimentScore(rec.sentiment.scoreWeek)}
              </span>
            </div>
            <div>
              <p className="text-xs text-white/40">1 month</p>
              <span className={`inline-block rounded border px-2 py-1 text-sm font-semibold ${scoreColor(rec.sentiment.scoreMonth)}`}>
                {formatSentimentScore(rec.sentiment.scoreMonth)}
              </span>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-white/50">
            Velocity {formatSignedScore(rec.sentiment.velocity)} · {rec.sentiment.mentionCount} mentions
          </p>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
            Value-to-Risk
          </h2>
          <p className="text-3xl font-bold text-mdc-blue tabular-nums">
            {rec.valueRisk.valueToRiskRatio.toFixed(2)}
          </p>
          <p className="text-xs text-white/50 mb-4">{rec.valueRisk.interpretation}</p>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-white/40">Entry zone</dt>
            <dd className="tabular-nums">
              {formatUsd(rec.valueRisk.entryLow)} – {formatUsd(rec.valueRisk.entryHigh)}
            </dd>
            <dt className="text-white/40">Stop loss</dt>
            <dd className="tabular-nums text-red-300">{formatUsd(rec.valueRisk.stopLoss)}</dd>
            <dt className="text-white/40">Upside target</dt>
            <dd className="tabular-nums text-emerald-300">{formatUsd(rec.valueRisk.upsideTarget)}</dd>
            <dt className="text-white/40">Time horizon</dt>
            <dd className="capitalize">{rec.timeHorizon}</dd>
          </dl>
        </section>
      </div>

      <section className="mb-8 rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
          Technical Indicators
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <Metric label="VWAP" value={formatUsd(t.vwap)} />
          <Metric label="EMA 9 / 20" value={`${t.ema9.toFixed(2)} / ${t.ema20.toFixed(2)}`} />
          <Metric label="SMA 50 / 200" value={`${t.sma50.toFixed(2)} / ${t.sma200.toFixed(2)}`} />
          <Metric label="RSI 14" value={t.rsi14.toFixed(1)} />
          <Metric label="ATR 14" value={t.atr14.toFixed(2)} />
          <Metric label="Rel. volume" value={`${t.relativeVolume.toFixed(2)}×`} />
          <Metric label="Premarket gap" value={formatPct(t.premarketGapPct)} />
          <Metric label="52w high dist." value={formatPct(-t.distanceFrom52wHighPct)} />
          <Metric label="1d / 5d / 20d" value={`${formatPct(t.return1d)} / ${formatPct(t.return5d)} / ${formatPct(t.return20d)}`} />
          <Metric label="MACD hist." value={t.macd.histogram.toFixed(3)} />
          <Metric label="BB upper" value={formatUsd(t.bollinger.upper)} />
          <Metric label="BB lower" value={formatUsd(t.bollinger.lower)} />
        </div>
      </section>

      {rec.strategies.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
            Strategy Matches
          </h2>
          <div className="space-y-3">
            {rec.strategies.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{s.name}</p>
                  <span className="text-xs capitalize text-white/50">{s.bias} · {s.strength}</span>
                </div>
                <p className="mt-1 text-sm text-white/60">{s.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {rec.warnings.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
            Warning Flags
          </h2>
          <div className="flex flex-wrap gap-2">
            {rec.warnings.map((w) => (
              <span
                key={w}
                className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-200"
              >
                {WARNING_LABELS[w]}
              </span>
            ))}
          </div>
        </section>
      )}

      <p className="mt-10 border-t border-white/10 pt-6 text-xs text-white/40">
        Algorithmic research only — not financial advice. Past performance does not guarantee future results.
      </p>
    </IntelligenceShell>
  );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  const pct = Math.min(100, Math.max(0, (score + 100) / 2));
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs text-white/50">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${signedScoreColor(score)}`}>
        {formatSignedScore(score)}
      </p>
      <div className="mt-2 h-1.5 rounded-full bg-white/10">
        <div className={`h-full rounded-full ${scoreBarColor(pct)}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-white/40 text-xs">{label}</p>
      <p className="font-medium tabular-nums">{value}</p>
    </div>
  );
}
