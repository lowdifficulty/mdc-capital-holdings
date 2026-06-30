import type { TechnicalSnapshot, ValueRiskPlan } from "./types";

function interpretRatio(ratio: number): string {
  if (ratio >= 3) return "excellent";
  if (ratio >= 2) return "strong";
  if (ratio >= 1.5) return "acceptable";
  if (ratio >= 1) return "weak";
  return "poor";
}

export function calculateValueRisk(tech: TechnicalSnapshot): ValueRiskPlan {
  const entry = tech.price;
  const atrStop = entry - tech.atr14 * 1.5;
  const vwapStop = tech.vwap * 0.985;
  const orStop = tech.openingRangeLow;
  const supportStop = Math.min(tech.bollinger.lower, tech.sma50);
  const stopLoss = Math.max(atrStop, Math.min(vwapStop, orStop, supportStop) * 0.995);

  const resistanceTarget = Math.max(tech.bollinger.upper, entry + tech.atr14 * 2);
  const priorHighTarget = entry + tech.atr14 * 2;
  const upsideTarget = Math.max(resistanceTarget, priorHighTarget);

  const downsideRisk = Math.max(entry - stopLoss, entry * 0.005);
  const upsideValue = Math.max(upsideTarget - entry, entry * 0.005);
  const valueToRiskRatio = upsideValue / downsideRisk;

  const entryPad = entry * 0.005;

  return {
    entryLow: entry - entryPad,
    entryHigh: entry + entryPad,
    stopLoss: Math.round(stopLoss * 100) / 100,
    upsideTarget: Math.round(upsideTarget * 100) / 100,
    downsideRisk: Math.round(downsideRisk * 100) / 100,
    upsideValue: Math.round(upsideValue * 100) / 100,
    valueToRiskRatio: Math.round(valueToRiskRatio * 100) / 100,
    interpretation: interpretRatio(valueToRiskRatio),
  };
}
