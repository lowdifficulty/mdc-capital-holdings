"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Recommendation } from "@/lib/intelligence/types";
import IntelligenceShell from "./IntelligenceShell";
import RecommendationCard from "./RecommendationCard";
import { signalColor } from "./intelligenceDisplay";

interface HistoryEntry {
  symbol: string;
  analyzedAt: string;
  signal: string;
  confidence: number;
}

export default function WatchlistPage() {
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      if (!session.user) {
        router.replace("/login");
        return;
      }
      const wlRes = await fetch("/api/watchlist");
      const wlData = await wlRes.json();
      setWatchlist(wlData.watchlist ?? []);
      setHistory(wlData.history ?? []);

      const recs: Recommendation[] = [];
      for (const sym of wlData.watchlist ?? []) {
        const r = await fetch(`/api/recommendations/${sym}`);
        if (r.ok) recs.push(await r.json());
      }
      setRecommendations(recs);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addSymbol(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol: draft }),
    });
    setDraft("");
    void load();
  }

  async function removeSymbol(symbol: string) {
    await fetch(`/api/watchlist?symbol=${symbol}`, { method: "DELETE" });
    void load();
  }

  const scoreChanges = history.filter((h, i, arr) => {
    const prev = arr.find((x, j) => j > i && x.symbol === h.symbol);
    return prev && Math.abs(h.confidence - prev.confidence) >= 10;
  });

  return (
    <IntelligenceShell title="Watchlist" subtitle="Track tickers and recommendation changes">
      <form onSubmit={addSymbol} className="mb-8 flex flex-wrap gap-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value.toUpperCase())}
          placeholder="Add ticker (e.g. NVDA)"
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-mdc-blue"
        />
        <button
          type="submit"
          className="rounded-full bg-mdc-blue px-5 py-2.5 text-sm font-semibold hover:bg-white hover:text-navy"
        >
          Add
        </button>
      </form>

      {loading && <p className="text-sm text-white/50">Loading watchlist…</p>}

      {recommendations.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
            Current Recommendations
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((r) => (
              <div key={r.symbol} className="relative">
                <RecommendationCard rec={r} />
                <button
                  type="button"
                  onClick={() => void removeSymbol(r.symbol)}
                  className="absolute right-3 top-3 text-xs text-white/40 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {watchlist.length === 0 && !loading && (
        <p className="text-sm text-white/50">No tickers on your watchlist yet.</p>
      )}

      {scoreChanges.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
            Meaningful Score Changes
          </h2>
          <div className="space-y-2">
            {scoreChanges.slice(0, 10).map((h, i) => (
              <div
                key={`${h.symbol}-${h.analyzedAt}-${i}`}
                className="flex items-center justify-between rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm"
              >
                <span className="font-semibold">{h.symbol}</span>
                <span>
                  {h.signal} · {h.confidence}/100 · {new Date(h.analyzedAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
            Recommendation History
          </h2>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-white/50">
                <tr>
                  <th className="px-4 py-3">Ticker</th>
                  <th className="px-4 py-3">Signal</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 30).map((h, i) => (
                  <tr key={`${h.symbol}-${h.analyzedAt}-${i}`} className="border-b border-white/5">
                    <td className="px-4 py-3 font-semibold">{h.symbol}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded border px-2 py-0.5 text-xs ${signalColor(h.signal as Recommendation["signal"])}`}>
                        {h.signal}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{h.confidence}</td>
                    <td className="px-4 py-3 text-white/50">
                      {new Date(h.analyzedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </IntelligenceShell>
  );
}
