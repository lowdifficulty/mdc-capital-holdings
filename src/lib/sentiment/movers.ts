import type { ApeWisdomRow } from "./apewisdom";
import { mentionVelocityScore as velocityScore } from "./apewisdom";
import type { SwaggyRow } from "./swaggystocks";
import { swaggySentimentScore } from "./swaggystocks";
import type { SentimentMover } from "./types";
import { REDDIT_INFLUENCE_WEIGHT } from "./utils";

function attentionScore(mentions: number): number {
  return Math.max(-1, Math.min(1, Math.log10(mentions + 1) / 2.2 - 0.15));
}

function moverDirection(velocity: number): SentimentMover["direction"] {
  if (velocity >= 0.08) return "heating_up";
  if (velocity <= -0.08) return "cooling_down";
  return "stable";
}

export function buildSocialMover(
  symbol: string,
  ape?: ApeWisdomRow,
  swaggy?: SwaggyRow
): SentimentMover | null {
  const apeMentions = (ape?.mentions ?? 0) * REDDIT_INFLUENCE_WEIGHT;
  const swaggyMentions = (swaggy?.mentions ?? 0) * REDDIT_INFLUENCE_WEIGHT;
  const weekMentions = apeMentions + swaggyMentions;

  if (!weekMentions && !ape && !swaggy) return null;

  const apeWeekScore = ape
    ? velocityScore(ape.mentions, ape.mentions_24h_ago)
    : 0;
  const swaggyScore = swaggy ? swaggySentimentScore(swaggy) : 0;

  const hasApe = Boolean(ape);
  const hasSwaggy = Boolean(swaggy);
  const h24Score =
    hasApe && hasSwaggy
      ? apeWeekScore * 0.6 + swaggyScore * 0.4
      : hasApe
        ? apeWeekScore
        : swaggyScore;

  const monthMentions = Math.max(weekMentions, (ape?.upvotes ?? 0) * REDDIT_INFLUENCE_WEIGHT);
  const monthScore = attentionScore(monthMentions);
  const weekScore = (h24Score + monthScore) / 2;

  const priorMentions =
    ape?.mentions_24h_ago != null
      ? ape.mentions_24h_ago * REDDIT_INFLUENCE_WEIGHT
      : Math.max(1, weekMentions * 0.75);
  const mentionVelocity =
    priorMentions > 0 ? (weekMentions - priorMentions) / priorMentions : weekMentions > 0 ? 1 : 0;

  const priorScore = monthScore * 0.75;
  const velocity = h24Score - priorScore;
  const moverScore = velocity * 0.65 + Math.max(-1, Math.min(1, mentionVelocity)) * 0.35;

  return {
    symbol,
    h24Score,
    weekScore,
    monthScore,
    velocity,
    mentionVelocity,
    weekMentions,
    monthMentions,
    moverScore,
    direction: moverDirection(velocity),
    rank: ape?.rank,
    name: ape?.name ?? swaggy?.name,
  };
}
