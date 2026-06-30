"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { IntelligenceSettings } from "@/lib/intelligence/types";
import IntelligenceShell from "./IntelligenceShell";

export default function IntelligenceSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<IntelligenceSettings | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    if (!session.user) {
      router.replace("/login");
      return;
    }
    const res = await fetch("/api/intelligence/settings");
    if (res.ok) setSettings(await res.json());
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!settings) return;
    await fetch("/api/intelligence/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!settings) {
    return (
      <IntelligenceShell title="Settings">
        <p className="text-sm text-white/50">Loading…</p>
      </IntelligenceShell>
    );
  }

  const weightTotal =
    settings.weights.sentiment +
    settings.weights.technical +
    settings.weights.momentum +
    settings.weights.valueRisk;

  return (
    <IntelligenceShell title="Intelligence Settings" subtitle="Weights, risk tolerance, filters">
      <div className="max-w-xl space-y-6">
        <fieldset className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-5">
          <legend className="px-1 text-sm font-semibold">Risk tolerance</legend>
          {(["conservative", "balanced", "aggressive"] as const).map((v) => (
            <label key={v} className="flex items-center gap-2 text-sm capitalize">
              <input
                type="radio"
                name="risk"
                checked={settings.riskTolerance === v}
                onChange={() => setSettings({ ...settings, riskTolerance: v })}
              />
              {v}
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-5">
          <legend className="px-1 text-sm font-semibold">Time horizon</legend>
          {(["intraday", "swing", "position"] as const).map((v) => (
            <label key={v} className="flex items-center gap-2 text-sm capitalize">
              <input
                type="radio"
                name="horizon"
                checked={settings.timeHorizon === v}
                onChange={() => setSettings({ ...settings, timeHorizon: v })}
              />
              {v}
            </label>
          ))}
        </fieldset>

        <label className="block text-sm">
          <span className="mb-1 block text-xs text-white/50">Minimum daily volume</span>
          <input
            type="number"
            value={settings.minVolume}
            onChange={(e) => setSettings({ ...settings, minVolume: Number(e.target.value) })}
            className="w-full rounded-lg border border-white/15 bg-navy px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-xs text-white/50">Minimum value-to-risk ratio</span>
          <input
            type="number"
            step={0.1}
            value={settings.minValueRisk}
            onChange={(e) => setSettings({ ...settings, minValueRisk: Number(e.target.value) })}
            className="w-full rounded-lg border border-white/15 bg-navy px-3 py-2"
          />
        </label>

        <fieldset className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-5">
          <legend className="px-1 text-sm font-semibold">Scoring weights</legend>
          <p className="text-xs text-white/40">Total: {(weightTotal * 100).toFixed(0)}% (risk penalty applied separately)</p>
          {(
            [
              ["sentiment", "Sentiment"],
              ["technical", "Technical"],
              ["momentum", "Momentum"],
              ["valueRisk", "Value-to-risk"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block text-xs text-white/50">{label}</span>
              <input
                type="range"
                min={0}
                max={0.5}
                step={0.05}
                value={settings.weights[key]}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    weights: { ...settings.weights, [key]: Number(e.target.value) },
                  })
                }
                className="w-full"
              />
              <span className="text-xs text-white/50">{(settings.weights[key] * 100).toFixed(0)}%</span>
            </label>
          ))}
        </fieldset>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.paperTradingMode}
            onChange={(e) => setSettings({ ...settings, paperTradingMode: e.target.checked })}
          />
          Paper trading mode (display only — no execution)
        </label>

        <button
          type="button"
          onClick={() => void save()}
          className="rounded-full bg-mdc-blue px-6 py-2.5 text-sm font-semibold hover:bg-white hover:text-navy"
        >
          {saved ? "Saved" : "Save settings"}
        </button>

        <p className="text-xs text-white/40">
          Outputs are algorithmic research only — not financial advice. No trades are executed automatically.
        </p>
      </div>
    </IntelligenceShell>
  );
}
