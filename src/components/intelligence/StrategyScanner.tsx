"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Recommendation } from "@/lib/intelligence/types";
import { STRATEGY_CATALOG } from "@/lib/intelligence/strategies";
import IntelligenceShell from "./IntelligenceShell";
import RecommendationCard from "./RecommendationCard";
import { signalColor } from "./intelligenceDisplay";

export default function StrategyScanner() {
  const router = useRouter();
  const [results, setResults] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [strategyId, setStrategyId] = useState("");
  const [minScore, setMinScore] = useState(50);
  const [minVr, setMinVr] = useState(1.5);
  const [bias, setBias] = useState("");

  const scan = useCallback(async () => {
    setLoading(true);
    try {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      if (!session.user) {
        router.replace("/login");
        return;
      }
      const params = new URLSearchParams();
      if (strategyId) params.set("strategy", strategyId);
      params.set("minScore", String(minScore));
      params.set("minValueRisk", String(minVr));
      if (bias) params.set("bias", bias);
      const res = await fetch(`/api/strategies/scan?${params}`);
      if (!res.ok) throw new Error("Scan failed");
      const data = await res.json();
      setResults(data.results);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [router, strategyId, minScore, minVr, bias]);

  useEffect(() => {
    void scan();
  }, [scan]);

  return (
    <IntelligenceShell title="Strategy Scanner" subtitle="Filter by strategy, score, and bias">
      <div className="mb-8 flex flex-wrap gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <label className="text-sm">
          <span className="mb-1 block text-xs text-white/50">Strategy</span>
          <select
            value={strategyId}
            onChange={(e) => setStrategyId(e.target.value)}
            className="rounded-lg border border-white/15 bg-navy px-3 py-2 text-sm"
          >
            <option value="">All strategies</option>
            {STRATEGY_CATALOG.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-white/50">Min score</span>
          <input
            type="number"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-24 rounded-lg border border-white/15 bg-navy px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-white/50">Min value/risk</span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={minVr}
            onChange={(e) => setMinVr(Number(e.target.value))}
            className="w-24 rounded-lg border border-white/15 bg-navy px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-white/50">Bias</span>
          <select
            value={bias}
            onChange={(e) => setBias(e.target.value)}
            className="rounded-lg border border-white/15 bg-navy px-3 py-2 text-sm"
          >
            <option value="">Any</option>
            <option value="bullish">Bullish</option>
            <option value="bearish">Bearish</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => void scan()}
          disabled={loading}
          className="self-end rounded-full bg-mdc-blue px-5 py-2 text-sm font-semibold hover:bg-white hover:text-navy disabled:opacity-50"
        >
          {loading ? "Scanning…" : "Scan"}
        </button>
      </div>

      <p className="mb-4 text-sm text-white/50">{results.length} matches</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((r) => (
          <RecommendationCard key={r.symbol} rec={r} />
        ))}
      </div>

      {results.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-white/50">
              <tr>
                <th className="px-4 py-3">Ticker</th>
                <th className="px-4 py-3">Signal</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Strategies</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.symbol} className="border-b border-white/5">
                  <td className="px-4 py-3 font-semibold">
                    <a href={`/intelligence/${r.symbol}`}>{r.symbol}</a>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded border px-2 py-0.5 text-xs ${signalColor(r.signal)}`}>
                      {r.signal}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{r.confidence}</td>
                  <td className="px-4 py-3 text-white/70">
                    {r.strategies.map((s) => s.name).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </IntelligenceShell>
  );
}
