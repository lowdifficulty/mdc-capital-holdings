import type { SentimentLabel } from "./types";

const POSITIVE = new Set([
  "surge",
  "soar",
  "rally",
  "gain",
  "gains",
  "beat",
  "beats",
  "upgrade",
  "upgraded",
  "bullish",
  "growth",
  "record",
  "profit",
  "profits",
  "strong",
  "outperform",
  "buy",
  "breakout",
  "recovery",
  "optimistic",
  "positive",
  "momentum",
  "expansion",
  "dividend",
  "raise",
  "raised",
  "exceeds",
  "exceeded",
  "boom",
  "win",
  "wins",
  "success",
  "successful",
  "partnership",
  "innovation",
  "approval",
  "approved",
]);

const NEGATIVE = new Set([
  "fall",
  "falls",
  "drop",
  "drops",
  "plunge",
  "plunges",
  "decline",
  "declines",
  "miss",
  "misses",
  "downgrade",
  "downgraded",
  "bearish",
  "loss",
  "losses",
  "weak",
  "underperform",
  "sell",
  "crash",
  "crashes",
  "lawsuit",
  "investigation",
  "fraud",
  "bankruptcy",
  "layoff",
  "layoffs",
  "cut",
  "cuts",
  "warning",
  "warns",
  "concern",
  "concerns",
  "risk",
  "risks",
  "volatile",
  "volatility",
  "recall",
  "probe",
  "scandal",
  "debt",
  "default",
  "slump",
  "slumps",
]);

const INTENSIFIERS = new Set(["very", "strongly", "significantly", "sharply", "major"]);
const NEGATORS = new Set(["not", "no", "never", "without"]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function scoreText(text: string): number {
  const tokens = tokenize(text);
  if (!tokens.length) return 0;

  let score = 0;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    let magnitude = 1;
    const prev = tokens[i - 1];
    const prev2 = tokens[i - 2];

    if (prev && NEGATORS.has(prev)) magnitude *= -1;
    if (prev && INTENSIFIERS.has(prev)) magnitude *= 1.5;
    if (prev2 && NEGATORS.has(prev2)) magnitude *= -1;

    if (POSITIVE.has(token)) score += 1 * magnitude;
    if (NEGATIVE.has(token)) score -= 1 * magnitude;
  }

  const normalized = score / Math.max(3, Math.sqrt(tokens.length));
  return Math.max(-1, Math.min(1, normalized));
}

export function labelFromScore(score: number): SentimentLabel {
  if (score >= 0.12) return "bullish";
  if (score <= -0.12) return "bearish";
  return "neutral";
}
