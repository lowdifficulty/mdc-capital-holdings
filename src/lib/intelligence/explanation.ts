import type { Recommendation } from "./types";

export function buildExplanation(rec: Recommendation): string {
  const { symbol, signal, confidence, sentiment, technical, valueRisk, warnings, strategies } = rec;
  const stratNames = strategies.slice(0, 3).map((s) => s.name).join(", ");
  const sentTrend =
    sentiment.velocity > 5
      ? "improved over the past week"
      : sentiment.velocity < -5
        ? "weakened over the past week"
        : "been relatively stable";

  let rsiNote = "";
  if (technical.rsi14 > 75) {
    rsiNote = " RSI is near overextended levels, so patience near VWAP is advised.";
  } else if (technical.rsi14 < 30) {
    rsiNote = " RSI is oversold, which may support a reversal if sentiment confirms.";
  }

  const warnNote =
    warnings.length > 0
      ? ` Warning flags: ${warnings.map((w) => w.replace(/_/g, " ")).join(", ")}.`
      : "";

  const entryMid = ((valueRisk.entryLow + valueRisk.entryHigh) / 2).toFixed(2);

  return (
    `${symbol} is rated ${signal} with a ${confidence}/100 confidence score. ` +
    `Sentiment has ${sentTrend} while the stock ${technical.price > technical.vwap ? "remains above" : "trades below"} VWAP ` +
    `and ${technical.price > technical.sma50 ? "above" : "below"} SMA 50. ` +
    `Momentum is ${rec.momentumScore >= 0 ? "positive" : "negative"} on recent returns.${rsiNote} ` +
    `Suggested entry near $${entryMid}, stop $${valueRisk.stopLoss.toFixed(2)}, target $${valueRisk.upsideTarget.toFixed(2)}, ` +
    `value-to-risk ${valueRisk.valueToRiskRatio.toFixed(1)} (${valueRisk.interpretation}).` +
    (stratNames ? ` Strategies triggered: ${stratNames}.` : "") +
    warnNote +
    " This is algorithmic research, not financial advice."
  );
}
