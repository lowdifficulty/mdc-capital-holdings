"use client";

import Link from "next/link";
import type { Recommendation } from "@/lib/intelligence/types";
import {
  formatSignedScore,
  formatUsd,
  signalColor,
  signedScoreColor,
} from "./intelligenceDisplay";

export default function RecommendationCard({
  rec,
  compact,
}: {
  rec: Recommendation;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/intelligence/${rec.symbol}`}
      className="block rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-mdc-blue/40 hover:bg-white/[0.07]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold tracking-tight">{rec.symbol}</p>
          <p className="text-xs text-white/50">{formatUsd(rec.price)}</p>
        </div>
        <span
          className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${signalColor(rec.signal)}`}
        >
          {rec.signal}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-2xl font-bold tabular-nums">{rec.confidence}</span>
        <span className="text-xs text-white/50">/ 100 confidence</span>
      </div>

      {!compact && (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-white/40">Sentiment</p>
              <p className={`font-semibold tabular-nums ${signedScoreColor(rec.sentimentScore)}`}>
                {formatSignedScore(rec.sentimentScore)}
              </p>
            </div>
            <div>
              <p className="text-white/40">Technical</p>
              <p className={`font-semibold tabular-nums ${signedScoreColor(rec.technicalScore)}`}>
                {formatSignedScore(rec.technicalScore)}
              </p>
            </div>
            <div>
              <p className="text-white/40">V/R</p>
              <p className="font-semibold tabular-nums text-mdc-blue">
                {rec.valueRisk.valueToRiskRatio.toFixed(1)}
              </p>
            </div>
          </div>
          {rec.strategies.length > 0 && (
            <p className="mt-2 truncate text-xs text-white/50">
              {rec.strategies[0].name}
              {rec.strategies.length > 1 ? ` +${rec.strategies.length - 1}` : ""}
            </p>
          )}
        </>
      )}
    </Link>
  );
}
