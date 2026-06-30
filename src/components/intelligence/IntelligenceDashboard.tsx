"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Recommendation } from "@/lib/intelligence/types";
import IntelligenceShell from "./IntelligenceShell";
import RecommendationCard from "./RecommendationCard";
import { formatSignedScore, signedScoreColor } from "./intelligenceDisplay";

interface DashboardPayload {
  analyzedAt: string;
  topRecommendations: Recommendation[];
  all: Recommendation[];
  positiveSentiment: Recommendation[];
  negativeSentiment: Recommendation[];
  bestValueRisk: Recommendation[];
  disclaimer: string;
}

export default function IntelligenceDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      if (!session.user) {
        router.replace("/login");
        return;
      }
      const res = await fetch("/api/recommendations");
      if (!res.ok) throw new Error("Failed to load recommendations");
      setData(await res.json());
    } catch {
      setError("Could not load intelligence data. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <IntelligenceShell
      title="Trading Intelligence"
      subtitle="Algorithmic research — not financial advice"
    >
      {loading && (
        <p className="text-sm text-white/60">Analyzing universe (this may take a minute)…</p>
      )}
      {error && <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      {data && (
        <>
          <p className="mb-6 text-xs text-white/40">
            Last analyzed {new Date(data.analyzedAt).toLocaleString()} · {data.all.length} tickers
          </p>

          <section className="mb-10">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
              Top Recommendations
            </h2>
            {data.topRecommendations.length === 0 ? (
              <p className="text-sm text-white/50">No Strong Buy or Buy signals in the current universe.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.topRecommendations.map((r) => (
                  <RecommendationCard key={r.symbol} rec={r} />
                ))}
              </div>
            )}
          </section>

          <div className="mb-10 grid gap-8 lg:grid-cols-2">
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
                Biggest Positive Sentiment Changes
              </h2>
              <div className="space-y-2">
                {data.positiveSentiment.map((r) => (
                  <SentimentRow key={r.symbol} rec={r} />
                ))}
              </div>
            </section>
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
                Biggest Negative Sentiment Changes
              </h2>
              <div className="space-y-2">
                {data.negativeSentiment.map((r) => (
                  <SentimentRow key={r.symbol} rec={r} />
                ))}
              </div>
            </section>
          </div>

          <section className="mb-10">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
              Best Value-to-Risk Setups
            </h2>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-white/50">
                  <tr>
                    <th className="px-4 py-3">Ticker</th>
                    <th className="px-4 py-3">Signal</th>
                    <th className="px-4 py-3">V/R</th>
                    <th className="px-4 py-3">Entry</th>
                    <th className="px-4 py-3">Stop</th>
                    <th className="px-4 py-3">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bestValueRisk.map((r) => (
                    <tr key={r.symbol} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 font-semibold">
                        <a href={`/intelligence/${r.symbol}`} className="hover:text-mdc-blue">
                          {r.symbol}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-white/70">{r.signal}</td>
                      <td className="px-4 py-3 font-semibold text-mdc-blue">
                        {r.valueRisk.valueToRiskRatio.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-white/70">
                        ${r.valueRisk.entryLow.toFixed(2)}–${r.valueRisk.entryHigh.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-red-300">
                        ${r.valueRisk.stopLoss.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-emerald-300">
                        ${r.valueRisk.upsideTarget.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
              Strategy Triggers
            </h2>
            <div className="space-y-3">
              {data.all
                .filter((r) => r.strategies.length > 0)
                .slice(0, 12)
                .map((r) => (
                  <div
                    key={r.symbol}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <a href={`/intelligence/${r.symbol}`} className="font-semibold hover:text-mdc-blue">
                      {r.symbol}
                    </a>
                    {r.strategies.slice(0, 2).map((s) => (
                      <span
                        key={s.id}
                        className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-white/70"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                ))}
            </div>
          </section>

          <p className="mt-10 border-t border-white/10 pt-6 text-xs text-white/40">{data.disclaimer}</p>
        </>
      )}
    </IntelligenceShell>
  );
}

function SentimentRow({ rec }: { rec: Recommendation }) {
  return (
    <a
      href={`/intelligence/${rec.symbol}`}
      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 hover:border-mdc-blue/30"
    >
      <span className="font-semibold">{rec.symbol}</span>
      <span className={`tabular-nums font-semibold ${signedScoreColor(rec.sentiment.velocity)}`}>
        {formatSignedScore(rec.sentiment.velocity)} velocity
      </span>
    </a>
  );
}
